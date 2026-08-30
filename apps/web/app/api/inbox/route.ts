import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import {
  getAuthenticatedOwnerId,
  parseInboxCaptureInput,
  saveInboxCapture,
} from "../../inbox/capture";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const ownerId = getAuthenticatedOwnerId(data?.claims ?? null);

  if (!ownerId) {
    return NextResponse.json(
      {
        message: "Your session expired. Sign in again to save ideas.",
      },
      { status: 401 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        message: "Send the idea as JSON.",
      },
      { status: 400 },
    );
  }

  const result = await saveInboxCapture({
    claims: { sub: ownerId },
    draft: parseInboxCaptureInput(payload),
    store: {
      async createIdea(record) {
        const { data: inserted, error } = await supabase
          .from("ideas")
          .insert(record)
          .select("id, created_at")
          .single();

        if (error || !inserted) {
          throw error ?? new Error("Unable to save your idea right now.");
        }

        return inserted;
      },
    },
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        fieldErrors: result.fieldErrors ?? {},
        message: result.message,
      },
      { status: result.status },
    );
  }

  return NextResponse.json(
    {
      createdAt: result.createdAt,
      ideaId: result.ideaId,
      message: result.message,
      structuringPending: result.structuringPending,
    },
    { status: 201 },
  );
}
