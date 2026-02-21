import { NextResponse } from "next/server";

import { toGraphDefinition } from "@/engine/graph-adapter";
import { persistRunResult } from "@/engine/persistence";
import { runFromNode } from "@/engine/runner";
import type { BuilderGraphSnapshot } from "@/engine/types";

interface RunFromNodePayload {
  snapshot?: BuilderGraphSnapshot;
  nodeId?: string;
  workflowId?: string;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as RunFromNodePayload;
    if (!payload.snapshot?.nodes || !payload.snapshot?.edges || !payload.nodeId) {
      return NextResponse.json({ ok: false, error: "Invalid request payload." }, { status: 400 });
    }

    const graph = toGraphDefinition(payload.snapshot);
    const result = await runFromNode(graph, payload.nodeId, payload.workflowId);
    await persistRunResult(result);

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run from node.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
