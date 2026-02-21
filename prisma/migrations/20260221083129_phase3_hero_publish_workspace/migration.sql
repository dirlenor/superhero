-- CreateTable
CREATE TABLE "heroes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "heroId" TEXT NOT NULL,
    "workspacePath" TEXT NOT NULL,
    "previewUrl" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "heroes_createdAt_idx" ON "heroes"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "heroes_heroId_idx" ON "heroes"("heroId");
