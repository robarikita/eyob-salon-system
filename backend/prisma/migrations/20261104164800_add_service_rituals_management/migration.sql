-- AlterTable Service: add columns safely with backfill for existing rows
ALTER TABLE "Service" ADD COLUMN "code" TEXT;
UPDATE "Service" SET "code" = 'SR-LEGACY-' || substr(id, 1, 8) WHERE "code" IS NULL;
ALTER TABLE "Service" ALTER COLUMN "code" SET NOT NULL;

ALTER TABLE "Service" ADD COLUMN "amharicName" TEXT,
ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Hair Styling & Couture',
ADD COLUMN "imageUrl" TEXT,
ADD COLUMN "minGuildRank" TEXT,
ADD COLUMN "preSetupBuffer" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "requiredProtocols" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "requiresApprentice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "standardCommission" DECIMAL(5,2),
ADD COLUMN "subCategory" TEXT,
ADD COLUMN "turnaroundBuffer" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN "workstationType" TEXT,
ALTER COLUMN "depositAmount" SET DEFAULT 100,
ALTER COLUMN "branchId" DROP NOT NULL;

-- CreateTable BranchService
CREATE TABLE "BranchService" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "customPrice" DECIMAL(10,2),
    "customDurationMinutes" INTEGER,
    "customTurnaround" INTEGER,
    "requiredDeposit" DECIMAL(12,2),
    "workstationLock" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BranchService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BranchService_branchId_serviceId_key" ON "BranchService"("branchId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Service_code_key" ON "Service"("code");

-- AddForeignKey
ALTER TABLE "BranchService" ADD CONSTRAINT "BranchService_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchService" ADD CONSTRAINT "BranchService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
