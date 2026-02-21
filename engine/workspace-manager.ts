import { spawn, spawnSync, type ChildProcess } from "child_process";
import { promises as fs } from "fs";
import net from "net";
import path from "path";

import type { FileOp, PatchPlanOutput, PreviewOutput, WorkspaceOutput } from "@/engine/types";

const DATA_DIR = path.resolve(process.cwd(), "data");
const TEMPLATE_DIR = path.join(DATA_DIR, "templates", "starter-next-gsap");
const WORKSPACES_DIR = path.join(DATA_DIR, "workspaces");
const THUMBNAILS_DIR = path.join(DATA_DIR, "thumbnails");

interface PreviewProcessEntry {
  workspacePath: string;
  heroId: string;
  port: number;
  url: string;
  pid: number;
  child: ChildProcess;
  logs: string[];
}

export interface WorkspaceFileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: WorkspaceFileNode[];
}

const previewRegistry = new Map<string, PreviewProcessEntry>();

function nowIso() {
  return new Date().toISOString();
}

function normalizeSlashes(value: string) {
  return value.replaceAll("\\", "/");
}

function sanitizeHeroId(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "hero";
}

function assertInside(basePath: string, candidatePath: string) {
  const normalizedBase = path.resolve(basePath);
  const normalizedCandidate = path.resolve(candidatePath);
  if (
    normalizedCandidate !== normalizedBase &&
    !normalizedCandidate.startsWith(`${normalizedBase}${path.sep}`)
  ) {
    throw new Error("Path escapes allowed directory.");
  }
}

function toAllowedHeroRoot(heroId: string) {
  return `src/heroes/${sanitizeHeroId(heroId)}`;
}

function normalizePatchPath(relativePath: string) {
  const normalized = path.posix.normalize(normalizeSlashes(relativePath)).replace(/^\//, "");
  if (!normalized || normalized === "." || normalized.startsWith("../") || normalized.includes("/../")) {
    throw new Error(`Invalid patch path '${relativePath}'.`);
  }
  return normalized;
}

function assertAllowedPatchPath(relativePath: string, heroId: string) {
  const normalized = normalizePatchPath(relativePath);
  const heroRoot = toAllowedHeroRoot(heroId);
  if (normalized !== heroRoot && !normalized.startsWith(`${heroRoot}/`)) {
    throw new Error(`Patch path '${relativePath}' is outside ${heroRoot}/.`);
  }
  return normalized;
}

function isProcessAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function fileExists(targetPath: string) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureRuntimeDirectories() {
  await fs.mkdir(WORKSPACES_DIR, { recursive: true });
  await fs.mkdir(THUMBNAILS_DIR, { recursive: true });
}

function requirePnpmInstalled() {
  const result = spawnSync("pnpm", ["--version"], { stdio: "ignore" });
  if (result.status !== 0) {
    throw new Error("pnpm is required for preview.run. Please install pnpm and retry.");
  }
}

async function ensureWorkspaceDependencies(workspacePath: string, log?: (message: string) => void) {
  const markerPath = path.join(workspacePath, ".superhero-deps-installed");
  const markerExists = await fileExists(markerPath);
  if (markerExists) {
    return;
  }

  log?.("Installing workspace dependencies with pnpm...");
  const installResult = spawnSync("pnpm", ["install"], {
    cwd: workspacePath,
    env: {
      ...process.env,
      FORCE_COLOR: "0",
    },
    encoding: "utf8",
  });

  if (installResult.status !== 0) {
    const stderr = installResult.stderr?.trim();
    throw new Error(stderr || "pnpm install failed in workspace");
  }

  await fs.writeFile(markerPath, nowIso(), "utf8");
  log?.("Workspace dependencies installed");
}

async function findFreePort(startPort: number, endPort = 3999): Promise<number> {
  for (let port = startPort; port <= endPort; port += 1) {
    const isFree = await new Promise<boolean>((resolve) => {
      const server = net.createServer();
      server.once("error", () => resolve(false));
      server.once("listening", () => {
        server.close(() => resolve(true));
      });
      server.listen(port, "127.0.0.1");
    });

    if (isFree) {
      return port;
    }
  }

  throw new Error(`No free port available between ${startPort} and ${endPort}.`);
}

async function waitForUrl(url: string, timeoutMs: number) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { method: "GET", cache: "no-store" });
      if (response.ok) {
        return;
      }
    } catch {
    }
    await new Promise((resolve) => setTimeout(resolve, 700));
  }

  throw new Error("Preview server did not become ready in time.");
}

function appendProcessLog(entry: PreviewProcessEntry, chunk: Buffer, source: "stdout" | "stderr") {
  const lines = chunk
    .toString("utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-8)
    .map((line) => `[${nowIso()}][${source}] ${line}`);

  entry.logs.push(...lines);
  if (entry.logs.length > 120) {
    entry.logs = entry.logs.slice(-120);
  }
}

export function getTemplatePath() {
  return TEMPLATE_DIR;
}

export function getWorkspacesRoot() {
  return WORKSPACES_DIR;
}

export function getThumbnailsRoot() {
  return THUMBNAILS_DIR;
}

export function resolveWorkspacePath(workspacePath: string) {
  const absolute = path.resolve(workspacePath);
  assertInside(WORKSPACES_DIR, absolute);
  return absolute;
}

export async function applyPatchPlanToWorkspace(
  runId: string,
  patchPlan: PatchPlanOutput,
  options?: { keepExisting?: boolean; log?: (message: string) => void }
): Promise<WorkspaceOutput> {
  await ensureRuntimeDirectories();
  const templateExists = await fileExists(TEMPLATE_DIR);
  if (!templateExists) {
    throw new Error("Starter template not found at data/templates/starter-next-gsap.");
  }

  const workspacePath = path.join(WORKSPACES_DIR, runId);
  const heroId = sanitizeHeroId(patchPlan.heroId);
  const keepExisting = options?.keepExisting ?? false;

  if (!keepExisting) {
    await fs.rm(workspacePath, { recursive: true, force: true });
  }

  await fs.cp(TEMPLATE_DIR, workspacePath, { recursive: true });

  for (const op of patchPlan.ops) {
    const relativePath = assertAllowedPatchPath(op.path, heroId);
    const absolutePath = path.resolve(workspacePath, relativePath);
    assertInside(workspacePath, absolutePath);

    if (op.kind === "mkdir") {
      await fs.mkdir(absolutePath, { recursive: true });
      options?.log?.(`mkdir ${relativePath}`);
      continue;
    }

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, op.content, "utf8");
    options?.log?.(`write ${relativePath}`);
  }

  const marker = {
    runId,
    heroId,
    workspaceName: patchPlan.workspaceName,
    appliedOps: patchPlan.ops.length,
    createdAt: nowIso(),
  };

  await fs.writeFile(
    path.join(workspacePath, ".superhero-workspace.json"),
    JSON.stringify(marker, null, 2),
    "utf8"
  );

  return {
    path: workspacePath,
    heroId,
  };
}

export async function runWorkspacePreview(
  workspacePathRaw: string,
  heroIdRaw: string,
  startPort = 3010,
  log?: (message: string) => void
): Promise<PreviewOutput> {
  requirePnpmInstalled();
  const workspacePath = resolveWorkspacePath(workspacePathRaw);
  const heroId = sanitizeHeroId(heroIdRaw);
  await ensureWorkspaceDependencies(workspacePath, log);

  const existing = previewRegistry.get(workspacePath);
  if (existing && isProcessAlive(existing.pid)) {
    return {
      url: existing.url,
      port: existing.port,
      pid: existing.pid,
    };
  }

  if (existing && !isProcessAlive(existing.pid)) {
    previewRegistry.delete(workspacePath);
  }

  const port = await findFreePort(startPort);
  const child = spawn("pnpm", ["dev", "--port", String(port)], {
    cwd: workspacePath,
    env: {
      ...process.env,
      FORCE_COLOR: "0",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (!child.pid) {
    throw new Error("Failed to start preview process.");
  }

  const url = `http://localhost:${port}/preview/${heroId}`;
  const entry: PreviewProcessEntry = {
    workspacePath,
    heroId,
    port,
    url,
    pid: child.pid,
    child,
    logs: [],
  };

  child.stdout?.on("data", (chunk: Buffer) => appendProcessLog(entry, chunk, "stdout"));
  child.stderr?.on("data", (chunk: Buffer) => appendProcessLog(entry, chunk, "stderr"));
  child.on("exit", () => {
    previewRegistry.delete(workspacePath);
  });

  previewRegistry.set(workspacePath, entry);
  log?.(`Started pnpm dev on port ${port} (pid ${entry.pid})`);

  try {
    await waitForUrl(url, 60000);
  } catch (error) {
    await stopWorkspacePreview(workspacePath);
    throw error;
  }

  return {
    url,
    port,
    pid: entry.pid,
  };
}

export async function stopWorkspacePreview(workspacePathRaw: string) {
  const workspacePath = resolveWorkspacePath(workspacePathRaw);
  const entry = previewRegistry.get(workspacePath);
  if (!entry) {
    return false;
  }

  const pid = entry.pid;
  if (isProcessAlive(pid)) {
    process.kill(pid, "SIGTERM");
    await new Promise((resolve) => setTimeout(resolve, 1200));
    if (isProcessAlive(pid)) {
      process.kill(pid, "SIGKILL");
    }
  }

  previewRegistry.delete(workspacePath);
  return true;
}

export function getPreviewProcess(workspacePathRaw: string) {
  const workspacePath = resolveWorkspacePath(workspacePathRaw);
  const entry = previewRegistry.get(workspacePath);
  if (!entry || !isProcessAlive(entry.pid)) {
    return null;
  }
  return {
    workspacePath: entry.workspacePath,
    heroId: entry.heroId,
    url: entry.url,
    port: entry.port,
    pid: entry.pid,
    logs: entry.logs,
  };
}

function toWorkspaceHeroRoot(workspacePath: string, heroId: string) {
  const normalizedHeroId = sanitizeHeroId(heroId);
  const root = path.resolve(workspacePath, "src", "heroes", normalizedHeroId);
  assertInside(workspacePath, root);
  return root;
}

async function walkTree(absPath: string, workspacePath: string): Promise<WorkspaceFileNode[]> {
  const entries = await fs.readdir(absPath, { withFileTypes: true });
  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  const nodes: WorkspaceFileNode[] = [];
  for (const entry of entries) {
    const entryAbs = path.join(absPath, entry.name);
    const relative = normalizeSlashes(path.relative(workspacePath, entryAbs));

    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: relative,
        type: "directory",
        children: await walkTree(entryAbs, workspacePath),
      });
      continue;
    }

    nodes.push({
      name: entry.name,
      path: relative,
      type: "file",
    });
  }

  return nodes;
}

export async function listWorkspaceHeroFiles(workspacePathRaw: string, heroIdRaw: string) {
  const workspacePath = resolveWorkspacePath(workspacePathRaw);
  const heroRoot = toWorkspaceHeroRoot(workspacePath, heroIdRaw);
  const exists = await fileExists(heroRoot);
  if (!exists) {
    return [];
  }
  return walkTree(heroRoot, workspacePath);
}

function assertEditableFilePath(workspacePath: string, heroId: string, relativeFilePath: string) {
  const normalized = assertAllowedPatchPath(relativeFilePath, heroId);
  const absolute = path.resolve(workspacePath, normalized);
  assertInside(workspacePath, absolute);
  return { normalized, absolute };
}

export async function readWorkspaceHeroFile(
  workspacePathRaw: string,
  heroIdRaw: string,
  relativeFilePath: string
) {
  const workspacePath = resolveWorkspacePath(workspacePathRaw);
  const heroId = sanitizeHeroId(heroIdRaw);
  const { absolute } = assertEditableFilePath(workspacePath, heroId, relativeFilePath);
  return fs.readFile(absolute, "utf8");
}

export async function writeWorkspaceHeroFile(
  workspacePathRaw: string,
  heroIdRaw: string,
  relativeFilePath: string,
  content: string
) {
  const workspacePath = resolveWorkspacePath(workspacePathRaw);
  const heroId = sanitizeHeroId(heroIdRaw);
  const { absolute } = assertEditableFilePath(workspacePath, heroId, relativeFilePath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, content, "utf8");
}

export async function createPlaceholderThumbnail(heroIdRaw: string, title: string) {
  await ensureRuntimeDirectories();
  const heroId = sanitizeHeroId(heroIdRaw);
  const fileName = `${heroId}-${Date.now()}.svg`;
  const absolute = path.join(THUMBNAILS_DIR, fileName);
  const safeTitle = title.replace(/[<>]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#111827"/><stop offset="100%" stop-color="#0ea5a4"/></linearGradient></defs><rect width="960" height="540" fill="url(#g)"/><circle cx="760" cy="130" r="140" fill="#22d3ee" fill-opacity="0.2"/><circle cx="220" cy="420" r="180" fill="#a78bfa" fill-opacity="0.18"/><text x="68" y="240" fill="#f8fafc" font-size="56" font-family="Arial, sans-serif" font-weight="700">${safeTitle}</text><text x="70" y="300" fill="#cbd5e1" font-size="28" font-family="Arial, sans-serif">Hero ID: ${heroId}</text></svg>`;
  await fs.writeFile(absolute, svg, "utf8");
  return {
    absolutePath: absolute,
    relativePath: normalizeSlashes(path.relative(process.cwd(), absolute)),
  };
}

export function createPatchPlan(ops: FileOp[], heroId: string, workspaceName: string): PatchPlanOutput {
  return {
    ops,
    heroId: sanitizeHeroId(heroId),
    workspaceName,
  };
}
