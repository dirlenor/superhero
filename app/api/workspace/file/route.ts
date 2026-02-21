import { NextResponse } from "next/server";

import { readWorkspaceHeroFile, writeWorkspaceHeroFile } from "@/engine/workspace-manager";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspacePath = searchParams.get("workspacePath");
    const heroId = searchParams.get("heroId");
    const filePath = searchParams.get("filePath");

    if (!workspacePath || !heroId || !filePath) {
      return NextResponse.json(
        { ok: false, error: "workspacePath, heroId, and filePath are required." },
        { status: 400 }
      );
    }

    const content = await readWorkspaceHeroFile(workspacePath, heroId, filePath);
    return NextResponse.json({ ok: true, content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read file.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      workspacePath?: string;
      heroId?: string;
      filePath?: string;
      content?: string;
    };

    if (!payload.workspacePath || !payload.heroId || !payload.filePath || typeof payload.content !== "string") {
      return NextResponse.json(
        { ok: false, error: "workspacePath, heroId, filePath, and content are required." },
        { status: 400 }
      );
    }

    await writeWorkspaceHeroFile(payload.workspacePath, payload.heroId, payload.filePath, payload.content);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to write file.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
