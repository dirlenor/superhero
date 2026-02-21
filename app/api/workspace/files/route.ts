import { NextResponse } from "next/server";

import { listWorkspaceHeroFiles } from "@/engine/workspace-manager";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspacePath = searchParams.get("workspacePath");
    const heroId = searchParams.get("heroId");

    if (!workspacePath || !heroId) {
      return NextResponse.json({ ok: false, error: "workspacePath and heroId are required." }, { status: 400 });
    }

    const files = await listWorkspaceHeroFiles(workspacePath, heroId);
    return NextResponse.json({ ok: true, files });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list workspace files.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
