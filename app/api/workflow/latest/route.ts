import { NextResponse } from "next/server";

import { getLatestRunResult } from "@/engine/persistence";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflowId") ?? "default-workflow";
    const result = await getLatestRunResult(workflowId);

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load latest run.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
