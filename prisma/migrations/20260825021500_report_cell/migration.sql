-- CreateTable
CREATE TABLE "ReportWorkbook" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'tamarindo-sheet',
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportWorkbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportSheet" (
    "id" TEXT NOT NULL,
    "workbookId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportCell" (
    "id" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "colIndex" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "value" DECIMAL(24,8),
    "formula" TEXT,
    "format" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "rowKind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportCell_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportWorkbook_kind_isLive_createdAt_idx" ON "ReportWorkbook"("kind", "isLive", "createdAt");

-- CreateIndex
CREATE INDEX "ReportWorkbook_createdById_idx" ON "ReportWorkbook"("createdById");

-- CreateIndex
CREATE INDEX "ReportSheet_workbookId_sortOrder_idx" ON "ReportSheet"("workbookId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ReportSheet_workbookId_key_key" ON "ReportSheet"("workbookId", "key");

-- CreateIndex
CREATE INDEX "ReportCell_sheetId_rowIndex_colIndex_idx" ON "ReportCell"("sheetId", "rowIndex", "colIndex");

-- CreateIndex
CREATE UNIQUE INDEX "ReportCell_sheetId_address_key" ON "ReportCell"("sheetId", "address");

-- AddForeignKey
ALTER TABLE "ReportWorkbook" ADD CONSTRAINT "ReportWorkbook_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSheet" ADD CONSTRAINT "ReportSheet_workbookId_fkey" FOREIGN KEY ("workbookId") REFERENCES "ReportWorkbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCell" ADD CONSTRAINT "ReportCell_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "ReportSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
