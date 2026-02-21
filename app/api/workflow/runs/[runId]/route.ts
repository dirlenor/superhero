import { NextResponse } from "next/server";

import { getRunResultById } from "@/engine/persistence";

interface Params {
  params: Promise<{ runId: string }>;
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflowId") ?? "default-workflow";
    const { runId } = await params;
    const result = await getRunResultById(runId, workflowId);

    if (!result) {
      return NextResponse.json({ ok: false, error: "Run not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load run.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
