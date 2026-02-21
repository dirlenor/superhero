import { ChevronDown, ChevronUp, Logs } from "lucide-react";

import type { NodeLogEntry } from "@/engine/types";

interface LogDrawerProps {
  open: boolean;
  onToggle: () => void;
  nodeLabel: string | null;
  logs: NodeLogEntry[];
}

export function LogDrawer({ open, onToggle, nodeLabel, logs }: LogDrawerProps) {
  return (
    <section className="glass-card rounded-xl px-3 py-2">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left"
        onClick={onToggle}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-[#e8f0ff]">
          <Logs className="size-4" />
          Node Logs {nodeLabel ? `- ${nodeLabel}` : ""}
        </span>
        {open ? (
          <ChevronDown className="size-4 text-[#9eb1d6]" />
        ) : (
          <ChevronUp className="size-4 text-[#9eb1d6]" />
        )}
      </button>

      {open ? (
        <div className="mt-2 max-h-44 overflow-auto rounded-lg border border-[#2f2f2f] bg-[#181818] p-2">
          {logs.length ? (
            <ul className="space-y-1.5 text-xs text-[#d5e4ff]">
              {logs.map((entry) => (
                <li key={entry.id} className="rounded border border-[#2c2c2c] bg-[#202020] p-2">
                  <p className="mb-0.5 text-[11px] text-[#91a3c8]">{entry.timestamp}</p>
                  <p>
                    <span className="mr-1 font-semibold uppercase">{entry.level}</span>
                    {entry.message}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#90a3cc]">No logs for the selected node yet.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
