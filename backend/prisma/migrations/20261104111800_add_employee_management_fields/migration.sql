-- AlterTable
ALTER TABLE "Branch" DROP COLUMN "address",
ADD COLUMN     "addressLine" TEXT NOT NULL,
ADD COLUMN     "city" TEXT NOT NULL DEFAULT 'Addis Ababa',
ADD COLUMN     "phoneNumber" TEXT NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL,
ALTER COLUMN "slotBufferMinutes" SET DEFAULT 10;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "amharicName" TEXT,
ADD COLUMN     "baseSalary" DECIMAL(12,2),
ADD COLUMN     "commissionRate" DECIMAL(5,2),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "employmentType" TEXT,
ADD COLUMN     "joinedDate" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "ritualTitle" TEXT,
ADD COLUMN     "workstation" TEXT;

-- AlterTable
ALTER TABLE "EmployeeSchedule" ADD COLUMN     "breakEndTime" TEXT,
ADD COLUMN     "breakStartTime" TEXT;

-- AlterTable
ALTER TABLE "EmployeeService" ADD COLUMN     "customCommissionRate" DECIMAL(5,2),
ADD COLUMN     "customDurationMinutes" INTEGER;

-- AlterTable
ALTER TABLE "ScheduleException" ADD COLUMN     "endDate" DATE,
ADD COLUMN     "reason" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Branch_slug_key" ON "Branch"("slug");

