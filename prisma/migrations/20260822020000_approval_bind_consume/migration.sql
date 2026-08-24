-- Additive U5: bind approvals to a payload hash, mark consumed after one
-- successful invoke, and store conversationId for DO resume (KTD5).
-- Do not edit the init migration.

ALTER TYPE "ApprovalStatus" ADD VALUE 'consumed';

ALTER TABLE "Approval" ADD COLUMN "payloadHash" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Approval" ADD COLUMN "conversationId" TEXT;

CREATE INDEX "Approval_conversationId_idx" ON "Approval"("conversationId");
