import { NextResponse } from "next/server";

import { toGraphDefinition } from "@/engine/graph-adapter";
import { persistRunResult } from "@/engine/persistence";
import { runWorkflow } from "@/engine/runner";
import type { BuilderGraphSnapshot } from "@/engine/types";

interface RunWorkflowPayload {
  snapshot?: BuilderGraphSnapshot;
  workflowId?: string;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as RunWorkflowPayload;
    if (!payload.snapshot?.nodes || !payload.snapshot?.edges) {
      return NextResponse.json({ ok: false, error: "Invalid request payload." }, { status: 400 });
    }

    const graph = toGraphDefinition(payload.snapshot);
    const result = await runWorkflow(graph, payload.workflowId);
    await persistRunResult(result);

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run workflow.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
