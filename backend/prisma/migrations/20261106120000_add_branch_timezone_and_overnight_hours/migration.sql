-- AlterTable
ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'Africa/Addis_Ababa';

-- AlterTable
ALTER TABLE "BranchHours" ADD COLUMN IF NOT EXISTS "closesNextDay" BOOLEAN NOT NULL DEFAULT false;

