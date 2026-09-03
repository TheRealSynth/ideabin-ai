import { NextResponse } from "next/server";
import { structureIdea } from "../../../../lib/ai/structure-idea";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Send the saved idea id as JSON." }, { status: 400 });
  }

  const ideaId =
    payload && typeof payload === "object" && typeof (payload as Record<string, unknown>).ideaId === "string"
      ? ((payload as Record<string, unknown>).ideaId as string).trim()
      : "";

  if (!ideaId) {
    return NextResponse.json({ message: "A saved idea id is required." }, { status: 400 });
  }

  try {
    const outcome = await structureIdea(ideaId);

    if (outcome.status === "structured") {
      return NextResponse.json({
        ideaId,
        message: "Saved idea structured successfully.",
        structuringPending: false,
        structuringStatus: "structured",
      });
    }

    if (outcome.status === "not_found") {
      return NextResponse.json(
        {
          ideaId,
          message: "That saved idea is unavailable to this session.",
          structuringPending: true,
          structuringStatus: "failed",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        ideaId,
        message: `Structuring failed (${outcome.reason}). The raw idea remains saved and can be retried.`,
        structuringPending: true,
        structuringStatus: "failed",
      },
      { status: 503 },
    );
  } catch {
    return NextResponse.json(
      {
        ideaId,
        message: "Structuring is unavailable right now. The raw idea remains saved and can be retried.",
        structuringPending: true,
        structuringStatus: "failed",
      },
      { status: 503 },
    );
  }
}
