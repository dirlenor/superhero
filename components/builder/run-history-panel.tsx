import { Clock3, History, Loader2 } from "lucide-react";

import type { RunHistoryItem } from "@/engine/types";

interface RunHistoryPanelProps {
  runs: RunHistoryItem[];
  selectedRunId: string | null;
  loading: boolean;
  onSelectRun: (runId: string) => void;
  onRefresh: () => void;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusPillClass(status: RunHistoryItem["status"]) {
  if (status === "success") {
    return "border-[#255636] bg-[#14291c] text-[#86efac]";
  }
  if (status === "error") {
    return "border-[#5a2323] bg-[#2b1414] text-[#fda4af]";
  }
  return "border-[#404654] bg-[#151922] text-[#cbd5e1]";
}

export function RunHistoryPanel({
  runs,
  selectedRunId,
  loading,
  onSelectRun,
  onRefresh,
}: RunHistoryPanelProps) {
  return (
    <section className="glass-card w-[280px] rounded-xl px-3 py-2">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-[#e8f0ff]">
          <History className="size-4" />
          Run History
        </p>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-md border border-[#2f3748] bg-[#141824] px-2 py-1 text-[11px] text-[#9eb1d6] hover:text-white"
        >
          Refresh
        </button>
      </div>

      <div className="max-h-64 space-y-2 overflow-auto pr-1">
        {loading ? (
          <div className="flex items-center gap-2 rounded-lg border border-[#2f2f2f] bg-[#181818] p-3 text-xs text-[#9eb1d6]">
            <Loader2 className="size-4 animate-spin" />
            Loading run history...
          </div>
        ) : runs.length === 0 ? (
          <p className="rounded-lg border border-[#2f2f2f] bg-[#181818] p-3 text-xs text-[#90a3cc]">
            No runs yet.
          </p>
        ) : (
          runs.map((run) => (
            <button
              key={run.runId}
              type="button"
              onClick={() => onSelectRun(run.runId)}
              className={`w-full rounded-lg border p-2 text-left transition-colors ${
                selectedRunId === run.runId
                  ? "border-[#4c6ca8] bg-[#1a2233]"
                  : "border-[#2f2f2f] bg-[#181818] hover:bg-[#1c202a]"
              }`}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold text-[#cbd5e1]">{run.runId.slice(0, 8)}</p>
                <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${statusPillClass(run.status)}`}>
                  {run.status}
                </span>
              </div>
              <p className="mb-1 flex items-center gap-1 text-[11px] text-[#93a6cc]">
                <Clock3 className="size-3" />
                {formatDateTime(run.createdAt)}
              </p>
              <p className="text-[11px] text-[#9eb1d6]">
                Nodes {run.nodeCount} • Success {run.successCount} • Error {run.errorCount}
              </p>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
