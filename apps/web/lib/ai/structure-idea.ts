import {
  buildAiRunLogRow,
  buildIdeaUpdatePayload,
  createProvider,
  hashRawInput,
  mergeIdeaMetadata,
  resolveDefaultRoute,
  structureRawIdea,
  type IdeaUpdatePayload,
  type StructuringResult,
} from "@ideabin/ai-structuring";
import { createSupabaseServerClient } from "../supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

interface IdeaRow {
  id: string;
  raw_input: string;
  metadata: Record<string, unknown> | null;
}

export type StructureIdeaOutcome =
  | { status: "structured"; ideaId: string }
  | { status: "not_found"; ideaId: string }
  | {
      status: "failed";
      ideaId: string;
      reason: "validation_failed" | "provider_error" | "persist_failed";
    };

/**
 * Mission 2 integration contract — "structure this saved idea":
 *
 *   const outcome = await structureIdea(ideaId);
 *
 * Fetches the idea through the caller's own RLS-scoped session (never a
 * service-role client, so cross-owner access is impossible through this
 * path), runs it through the provider-neutral structuring pipeline, and
 * persists results with a full ai_runs + idea_versions audit trail.
 *
 * `raw_input` is never read into an update payload and never written to.
 * Any failure — provider outage, invalid output, or a persistence error —
 * leaves the `ideas` row exactly as it was before the call; the caller can
 * always retry. Callers that need a Server Action reference (e.g. a form's
 * `action` prop) should wrap this in their own `"use server"` function.
 */
export async function structureIdea(ideaId: string): Promise<StructureIdeaOutcome> {
  const supabase = await createSupabaseServerClient();

  const { data, error: fetchError } = await supabase
    .from("ideas")
    .select("id, raw_input, metadata")
    .eq("id", ideaId)
    .maybeSingle();

  const idea = data as IdeaRow | null;

  // RLS scopes this select to the caller's own rows. A row owned by another
  // user is indistinguishable from a nonexistent one here — that is the
  // intended, safe behavior, not a gap to special-case around.
  if (fetchError || !idea) {
    return { status: "not_found", ideaId };
  }

  const route = resolveDefaultRoute();
  const provider = createProvider(route.providerId);
  const inputVersion = hashRawInput(idea.raw_input);
  const startedAt = Date.now();

  const result: StructuringResult = await structureRawIdea({
    rawInput: idea.raw_input,
    provider,
    model: route.model,
  });

  const totalLatencyMs = Date.now() - startedAt;
  const runLogRow = buildAiRunLogRow({ ideaId, inputVersion, totalLatencyMs, result });

  if (result.status === "failed") {
    // Audit the failed attempt; do not touch the idea row at all.
    await supabase.from("ai_runs").insert(runLogRow);
    return { status: "failed", ideaId, reason: result.reason };
  }

  const updatePayload = buildIdeaUpdatePayload({
    structured: result.data,
    provider: result.provider,
    model: result.model,
    promptVersion: result.promptVersion,
    repairUsed: result.repairUsed,
  });
  const mergedMetadata = mergeIdeaMetadata(idea.metadata, updatePayload);

  const { error: updateError } = await supabase
    .from("ideas")
    .update({
      title: updatePayload.title,
      summary: updatePayload.summary,
      problem: updatePayload.problem,
      solution: updatePayload.solution,
      target_user: updatePayload.target_user,
      revenue_model: updatePayload.revenue_model,
      distribution: updatePayload.distribution,
      tags: updatePayload.tags,
      status: updatePayload.status,
      metadata: mergedMetadata,
    })
    .eq("id", ideaId);

  await supabase.from("ai_runs").insert({
    ...runLogRow,
    status: updateError ? "persist_failed" : runLogRow.status,
  });

  if (updateError) {
    return { status: "failed", ideaId, reason: "persist_failed" };
  }

  await recordIdeaVersionSnapshot(supabase, ideaId, idea.raw_input, updatePayload);

  return { status: "structured", ideaId };
}

async function recordIdeaVersionSnapshot(
  supabase: SupabaseServerClient,
  ideaId: string,
  rawInput: string,
  updatePayload: IdeaUpdatePayload,
): Promise<void> {
  const { data } = await supabase
    .from("idea_versions")
    .select("version_no")
    .eq("idea_id", ideaId)
    .order("version_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  const latest = data as { version_no: number } | null;
  const nextVersionNo = (latest?.version_no ?? 0) + 1;

  // idea_versions is append-only by contract: always insert a new row,
  // never update an existing one.
  await supabase.from("idea_versions").insert({
    idea_id: ideaId,
    version_no: nextVersionNo,
    snapshot: {
      raw_input: rawInput,
      normalized: {
        title: updatePayload.title,
        summary: updatePayload.summary,
        problem: updatePayload.problem,
        solution: updatePayload.solution,
        target_user: updatePayload.target_user,
        revenue_model: updatePayload.revenue_model,
        distribution: updatePayload.distribution,
        tags: updatePayload.tags,
      },
      ai_structuring: updatePayload.metadata_patch.ai_structuring,
    },
    change_reason: `ai_structuring:${updatePayload.metadata_patch.ai_structuring.prompt_version}`,
  });
}
