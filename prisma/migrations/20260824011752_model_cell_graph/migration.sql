-- AlterTable
ALTER TABLE "Approval" ALTER COLUMN "payloadHash" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ModelScenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "variables" JSONB NOT NULL,
    "isBase" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModelScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelCell" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "sheet" TEXT NOT NULL,
    "lineId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fy" INTEGER,
    "kind" TEXT NOT NULL,
    "value" DECIMAL(24,8) NOT NULL,
    "formula" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelCell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelCellDep" (
    "id" TEXT NOT NULL,
    "cellId" TEXT NOT NULL,
    "inputId" TEXT NOT NULL,

    CONSTRAINT "ModelCellDep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModelScenario_isBase_createdAt_idx" ON "ModelScenario"("isBase", "createdAt");

-- CreateIndex
CREATE INDEX "ModelScenario_createdById_idx" ON "ModelScenario"("createdById");

-- CreateIndex
CREATE INDEX "ModelCell_scenarioId_sheet_idx" ON "ModelCell"("scenarioId", "sheet");

-- CreateIndex
CREATE INDEX "ModelCell_scenarioId_lineId_idx" ON "ModelCell"("scenarioId", "lineId");

-- CreateIndex
CREATE UNIQUE INDEX "ModelCell_scenarioId_key_key" ON "ModelCell"("scenarioId", "key");

-- CreateIndex
CREATE INDEX "ModelCellDep_inputId_idx" ON "ModelCellDep"("inputId");

-- CreateIndex
CREATE UNIQUE INDEX "ModelCellDep_cellId_inputId_key" ON "ModelCellDep"("cellId", "inputId");

-- AddForeignKey
ALTER TABLE "ModelScenario" ADD CONSTRAINT "ModelScenario_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelCell" ADD CONSTRAINT "ModelCell_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "ModelScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelCellDep" ADD CONSTRAINT "ModelCellDep_cellId_fkey" FOREIGN KEY ("cellId") REFERENCES "ModelCell"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelCellDep" ADD CONSTRAINT "ModelCellDep_inputId_fkey" FOREIGN KEY ("inputId") REFERENCES "ModelCell"("id") ON DELETE CASCADE ON UPDATE CASCADE;
