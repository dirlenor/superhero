import { Logs } from "lucide-react";

import type { NodeLogEntry } from "@/engine/types";

interface LogDrawerProps {
  nodeLabel: string | null;
  logs: NodeLogEntry[];
  statusMessage: string;
}

function formatLog(entry: NodeLogEntry) {
  return `[${entry.level.toUpperCase()}] ${entry.message}`;
}

export function LogDrawer({ nodeLabel, logs, statusMessage }: LogDrawerProps) {
  const latest = logs.at(-1);
  const line = latest ? formatLog(latest) : statusMessage;

  return (
    <section className="glass-card w-full rounded-xl px-4 py-2">
      <div className="flex items-center gap-3">
        <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-[#e8f0ff]">
          <Logs className="size-4" />
          Node Logs{nodeLabel ? ` - ${nodeLabel}` : ""}
        </span>
        <p className="truncate text-xs text-[#9fb0cf]">{line}</p>
      </div>
    </section>
  );
}
