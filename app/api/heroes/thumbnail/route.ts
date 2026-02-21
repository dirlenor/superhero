import { promises as fs } from "fs";
import path from "path";

import { NextResponse } from "next/server";

import { getThumbnailsRoot } from "@/engine/workspace-manager";

function assertInside(basePath: string, candidatePath: string) {
  const base = path.resolve(basePath);
  const candidate = path.resolve(candidatePath);
  if (candidate !== base && !candidate.startsWith(`${base}${path.sep}`)) {
    throw new Error("Invalid thumbnail path.");
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const relative = searchParams.get("path");
    if (!relative) {
      return NextResponse.json({ ok: false, error: "path is required." }, { status: 400 });
    }

    const absolute = path.resolve(process.cwd(), relative);
    assertInside(getThumbnailsRoot(), absolute);

    const content = await fs.readFile(absolute);
    const contentType = absolute.endsWith(".svg") ? "image/svg+xml" : "application/octet-stream";

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load thumbnail.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
