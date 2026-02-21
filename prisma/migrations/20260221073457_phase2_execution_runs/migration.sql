-- CreateTable
CREATE TABLE "workflow_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME
);

-- CreateTable
CREATE TABLE "node_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "finishedAt" DATETIME,
    "durationMs" INTEGER,
    "logsText" TEXT NOT NULL,
    "outputJson" JSONB,
    CONSTRAINT "node_runs_runId_fkey" FOREIGN KEY ("runId") REFERENCES "workflow_runs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "workflow_runs_workflowId_createdAt_idx" ON "workflow_runs"("workflowId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "node_runs_runId_idx" ON "node_runs"("runId");

-- CreateIndex
CREATE INDEX "node_runs_nodeId_startedAt_idx" ON "node_runs"("nodeId", "startedAt" DESC);
