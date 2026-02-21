"use client";

import { useState } from "react";
import { ExternalLink, Loader2, RefreshCw, Square } from "lucide-react";

interface PreviewPanelProps {
  previewUrl: string;
  workspacePath: string | null;
  onRestart: () => void;
}

export function PreviewPanel({ previewUrl, workspacePath, onRestart }: PreviewPanelProps) {
  const [stopping, setStopping] = useState(false);
  const [status, setStatus] = useState("Running");

  const stopPreview = async () => {
    if (!workspacePath) {
      setStatus("Workspace path is unavailable for stop action");
      return;
    }
    setStopping(true);
    try {
      const response = await fetch("/api/workspace/preview/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspacePath }),
      });
      const payload = (await response.json()) as { ok: boolean; stopped?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Failed to stop preview");
      }
      setStatus(payload.stopped ? "Stopped" : "Already stopped");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to stop preview");
    } finally {
      setStopping(false);
    }
  };

  return (
    <section className="glass-card flex h-[380px] min-w-[560px] flex-col overflow-hidden rounded-xl border border-[#2f2f2f]">
      <div className="flex items-center justify-between border-b border-[#2d313a] px-3 py-2">
        <div>
          <p className="text-sm font-semibold text-[#d3def7]">Preview</p>
          <p className="text-[11px] text-[#8fa2cb]">{status}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-[#2f3748] bg-[#141824] px-2 py-1 text-[11px] font-semibold text-[#d3def7]"
          >
            <ExternalLink className="size-3" />
            Open
          </a>
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex items-center gap-1 rounded-md border border-[#2f3748] bg-[#141824] px-2 py-1 text-[11px] font-semibold text-[#d3def7]"
          >
            <RefreshCw className="size-3" />
            Restart
          </button>
          <button
            type="button"
            onClick={() => {
              void stopPreview();
            }}
            disabled={stopping || !workspacePath}
            className="inline-flex items-center gap-1 rounded-md border border-[#552525] bg-[#2a1313] px-2 py-1 text-[11px] font-semibold text-[#f8b4b4] disabled:opacity-60"
          >
            {stopping ? <Loader2 className="size-3 animate-spin" /> : <Square className="size-3" />}
            Stop
          </button>
        </div>
      </div>
      <iframe
        src={previewUrl}
        title="Hero Preview"
        className="h-full w-full bg-[#0b0d12]"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
      />
    </section>
  );
}
