import type { Prisma, RunStatus } from "@prisma/client";

import type {
  NodeStatus,
  EngineRunResult,
  NodeExecutionState,
  RunHistoryItem,
} from "@/engine/types";
import { db } from "@/lib/db";

type WorkflowRunWithNodeRuns = Prisma.WorkflowRunGetPayload<{ include: { nodeRuns: true } }>;

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : undefined;
}

function logsTextToLines(logsText: string) {
  if (!logsText.trim()) {
    return [];
  }
  return logsText.split("\n").filter((line) => line.trim().length > 0);
}

function mapRunToEngineResult(
  run: WorkflowRunWithNodeRuns | null
): EngineRunResult | null {
  if (!run) {
    return null;
  }

  const nodeStates: Record<string, NodeExecutionState> = Object.fromEntries(
    run.nodeRuns.map((nodeRun) => [
      nodeRun.nodeId,
      {
        nodeId: nodeRun.nodeId,
        status: nodeRun.status as NodeStatus,
        startedAt: nodeRun.startedAt.toISOString(),
        finishedAt: toIso(nodeRun.finishedAt),
        durationMs: nodeRun.durationMs ?? undefined,
        logs: logsTextToLines(nodeRun.logsText),
        output:
          nodeRun.outputJson && typeof nodeRun.outputJson === "object"
            ? (nodeRun.outputJson as Record<string, unknown>)
            : undefined,
      } satisfies NodeExecutionState,
    ])
  );

  return {
    runId: run.id,
    workflowId: run.workflowId,
    status: run.status,
    createdAt: run.createdAt.toISOString(),
    finishedAt: toIso(run.finishedAt),
    executedNodeIds: run.nodeRuns
      .filter((nodeRun) => nodeRun.status === "success")
      .map((nodeRun) => nodeRun.nodeId),
    nodeStates,
    errors: [],
  };
}

export async function persistRunResult(result: EngineRunResult) {
  const nodeRunCreates = Object.values(result.nodeStates)
    .filter((state) => state.status !== "idle")
    .map((state) => ({
      nodeId: state.nodeId,
      status: state.status as RunStatus,
      startedAt: state.startedAt ? new Date(state.startedAt) : new Date(result.createdAt),
      finishedAt: state.finishedAt ? new Date(state.finishedAt) : null,
      durationMs: state.durationMs ?? null,
      logsText: state.logs.join("\n"),
      outputJson: state.output ? (state.output as Prisma.InputJsonValue) : undefined,
    }));

  await db.workflowRun.create({
    data: {
      id: result.runId,
      workflowId: result.workflowId ?? "default-workflow",
      status: result.status as RunStatus,
      createdAt: new Date(result.createdAt),
      finishedAt: result.finishedAt ? new Date(result.finishedAt) : null,
      nodeRuns: {
        create: nodeRunCreates,
      },
    },
  });
}

export async function getLatestRunResult(workflowId = "default-workflow") {
  const latest = await db.workflowRun.findFirst({
    where: { workflowId },
    orderBy: { createdAt: "desc" },
    include: {
      nodeRuns: true,
    },
  });

  return mapRunToEngineResult(latest);
}

export async function getRunResultById(runId: string, workflowId = "default-workflow") {
  const run = await db.workflowRun.findFirst({
    where: {
      id: runId,
      workflowId,
    },
    include: {
      nodeRuns: true,
    },
  });

  return mapRunToEngineResult(run);
}

export async function getRunHistory(workflowId = "default-workflow", limit = 10): Promise<RunHistoryItem[]> {
  const runs = await db.workflowRun.findMany({
    where: { workflowId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      nodeRuns: {
        select: {
          status: true,
        },
      },
    },
  });

  return runs.map((run) => {
    const nodeCount = run.nodeRuns.length;
    const successCount = run.nodeRuns.filter((nodeRun) => nodeRun.status === "success").length;
    const errorCount = run.nodeRuns.filter((nodeRun) => nodeRun.status === "error").length;

    return {
      runId: run.id,
      workflowId: run.workflowId,
      status: run.status,
      createdAt: run.createdAt.toISOString(),
      finishedAt: toIso(run.finishedAt),
      nodeCount,
      successCount,
      errorCount,
    } satisfies RunHistoryItem;
  });
}
