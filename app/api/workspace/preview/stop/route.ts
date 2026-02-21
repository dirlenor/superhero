import { NextResponse } from "next/server";

import { stopWorkspacePreview } from "@/engine/workspace-manager";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { workspacePath?: string };
    if (!payload.workspacePath) {
      return NextResponse.json({ ok: false, error: "workspacePath is required." }, { status: 400 });
    }

    const stopped = await stopWorkspacePreview(payload.workspacePath);
    return NextResponse.json({ ok: true, stopped });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to stop preview.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
