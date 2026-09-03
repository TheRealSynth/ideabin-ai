import { NextResponse } from "next/server";
import { evaluateIdea } from "../../../../../lib/evaluation/evaluate-idea";
import type { EvaluationInput } from "../../../../../lib/evaluation/evaluation";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Send evaluation input as JSON." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ message: "Send evaluation input as JSON." }, { status: 400 });
  }

  const result = await evaluateIdea(id, payload as EvaluationInput);

  switch (result.status) {
    case "evaluated":
      return NextResponse.json({
        status: result.status,
        ideaId: result.ideaId,
        evaluationId: result.evaluationId,
        recommendationId: result.recommendationId,
        opportunityScore: result.prepared.opportunityScore,
        confidence: result.prepared.confidence,
        recommendation: result.prepared.recommendation,
      });
    case "invalid_input":
      return NextResponse.json(
        { message: result.message, fieldErrors: result.fieldErrors },
        { status: 400 },
      );
    case "invalid_state":
      return NextResponse.json(
        { message: `Structure this idea before evaluating it. Current status: ${result.currentStatus}.` },
        { status: 409 },
      );
    case "unauthorized":
      return NextResponse.json({ message: "Sign in again to evaluate ideas." }, { status: 401 });
    case "not_found":
      return NextResponse.json({ message: "Idea not found." }, { status: 404 });
    case "persist_failed":
      return NextResponse.json(
        { message: `Evaluation could not finish at the ${result.stage} stage. Existing immutable records were not edited.` },
        { status: 500 },
      );
  }
}
