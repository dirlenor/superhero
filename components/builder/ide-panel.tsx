"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { FileCode2, FolderTree, Loader2, RefreshCcw, Save } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface WorkspaceFileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: WorkspaceFileNode[];
}

interface IdePanelProps {
  workspacePath: string;
  heroId: string;
}

function detectLanguage(filePath: string) {
  if (filePath.endsWith(".tsx")) return "typescript";
  if (filePath.endsWith(".ts")) return "typescript";
  if (filePath.endsWith(".json")) return "json";
  if (filePath.endsWith(".css")) return "css";
  return "plaintext";
}

function flattenFirstFile(nodes: WorkspaceFileNode[]): string | null {
  for (const node of nodes) {
    if (node.type === "file") {
      return node.path;
    }
    if (node.children?.length) {
      const nested = flattenFirstFile(node.children);
      if (nested) {
        return nested;
      }
    }
  }
  return null;
}

export function IdePanel({ workspacePath, heroId }: IdePanelProps) {
  const [tree, setTree] = useState<WorkspaceFileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("Ready");
  const [loadingTree, setLoadingTree] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchTree = useCallback(async () => {
    setLoadingTree(true);
    try {
      const response = await fetch(
        `/api/workspace/files?workspacePath=${encodeURIComponent(workspacePath)}&heroId=${encodeURIComponent(heroId)}`,
        { cache: "no-store" }
      );
      const payload = (await response.json()) as {
        ok: boolean;
        files?: WorkspaceFileNode[];
        error?: string;
      };
      if (!response.ok || !payload.ok || !payload.files) {
        throw new Error(payload.error ?? "Failed to load workspace tree");
      }

      setTree(payload.files);
      setStatus(`Loaded ${payload.files.length} top-level entries`);
      if (!selectedFile) {
        const initial = flattenFirstFile(payload.files);
        if (initial) {
          setSelectedFile(initial);
        }
      }
    } catch (error) {
      setTree([]);
      setStatus(error instanceof Error ? error.message : "Failed to load workspace tree");
    } finally {
      setLoadingTree(false);
    }
  }, [heroId, selectedFile, workspacePath]);

  const fetchFile = useCallback(async (filePath: string) => {
    setLoadingFile(true);
    try {
      const response = await fetch(
        `/api/workspace/file?workspacePath=${encodeURIComponent(workspacePath)}&heroId=${encodeURIComponent(heroId)}&filePath=${encodeURIComponent(filePath)}`,
        { cache: "no-store" }
      );
      const payload = (await response.json()) as {
        ok: boolean;
        content?: string;
        error?: string;
      };
      if (!response.ok || !payload.ok || typeof payload.content !== "string") {
        throw new Error(payload.error ?? "Failed to load file");
      }
      setContent(payload.content);
      setStatus(`Editing ${filePath}`);
    } catch (error) {
      setContent("");
      setStatus(error instanceof Error ? error.message : "Failed to load file");
    } finally {
      setLoadingFile(false);
    }
  }, [heroId, workspacePath]);

  useEffect(() => {
    void fetchTree();
  }, [fetchTree]);

  useEffect(() => {
    if (!selectedFile) {
      return;
    }
    void fetchFile(selectedFile);
  }, [fetchFile, selectedFile]);

  const saveFile = useCallback(async () => {
    if (!selectedFile) return;
    setSaving(true);
    try {
      const response = await fetch("/api/workspace/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspacePath,
          heroId,
          filePath: selectedFile,
          content,
        }),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Failed to save file");
      }
      setStatus(`Saved ${selectedFile}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to save file");
    } finally {
      setSaving(false);
    }
  }, [content, heroId, selectedFile, workspacePath]);

  const renderTree = useCallback((nodes: WorkspaceFileNode[], depth = 0) => {
    return nodes.map((node) => {
      if (node.type === "directory") {
        return (
          <div key={node.path}>
            <p className="px-2 py-1 text-[11px] font-semibold text-[#8ea3cd]" style={{ paddingLeft: `${depth * 14 + 8}px` }}>
              {node.name}
            </p>
            {node.children?.length ? renderTree(node.children, depth + 1) : null}
          </div>
        );
      }

      return (
        <button
          key={node.path}
          type="button"
          onClick={() => setSelectedFile(node.path)}
          className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[11px] ${
            selectedFile === node.path
              ? "bg-[#1f283a] text-[#d8e6ff]"
              : "text-[#9bb0d8] hover:bg-[#1b2230]"
          }`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          <FileCode2 className="size-3" />
          {node.name}
        </button>
      );
    });
  }, [selectedFile]);

  const language = useMemo(() => detectLanguage(selectedFile ?? ""), [selectedFile]);

  return (
    <section className="glass-card flex h-[380px] min-w-[640px] overflow-hidden rounded-xl border border-[#2f2f2f]">
      <div className="flex w-[240px] flex-col border-r border-[#2d313a] bg-[#10131a]">
        <div className="flex items-center justify-between border-b border-[#2d313a] px-3 py-2">
          <p className="flex items-center gap-2 text-xs font-semibold text-[#d3def7]">
            <FolderTree className="size-4" />
            Workspace Files
          </p>
          <button
            type="button"
            onClick={() => {
              void fetchTree();
            }}
            className="rounded-md border border-[#2f3748] bg-[#141824] p-1 text-[#9eb1d6] hover:text-white"
          >
            {loadingTree ? <Loader2 className="size-3 animate-spin" /> : <RefreshCcw className="size-3" />}
          </button>
        </div>

        <div className="flex-1 overflow-auto p-2">{renderTree(tree)}</div>
      </div>

      <div className="flex flex-1 flex-col bg-[#0c1018]">
        <div className="flex items-center justify-between border-b border-[#2d313a] px-3 py-2">
          <p className="text-xs text-[#9fb0cf]">{selectedFile ?? "Select a file"}</p>
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-[#7f90b3]">{status}</p>
            <button
              type="button"
              disabled={!selectedFile || saving}
              onClick={() => {
                void saveFile();
              }}
              className="inline-flex items-center gap-1 rounded-md border border-[#2f3748] bg-[#141824] px-2 py-1 text-[11px] font-semibold text-[#d3def7] disabled:opacity-60"
            >
              {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
              Save
            </button>
          </div>
        </div>

        <div className="flex-1">
          {loadingFile ? (
            <div className="flex h-full items-center justify-center text-sm text-[#8ea3cd]">Loading file...</div>
          ) : (
            <MonacoEditor
              path={selectedFile ?? ""}
              language={language}
              value={content}
              onChange={(value) => setContent(value ?? "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
