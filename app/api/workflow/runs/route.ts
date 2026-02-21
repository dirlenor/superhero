import { NextResponse } from "next/server";

import { getRunHistory } from "@/engine/persistence";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflowId") ?? "default-workflow";
    const rawLimit = Number(searchParams.get("limit") ?? "10");
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 30)) : 10;

    const runs = await getRunHistory(workflowId, limit);
    return NextResponse.json({ ok: true, runs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load run history.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
