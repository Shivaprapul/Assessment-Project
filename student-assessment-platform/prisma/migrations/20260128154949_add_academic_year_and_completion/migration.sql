-- CreateEnum
CREATE TYPE "completion_type" AS ENUM ('SOFT', 'HARD');

-- CreateEnum
CREATE TYPE "badge_type" AS ENUM ('MASTERY', 'COMPLETION_CERTIFICATE');

-- AlterTable
ALTER TABLE "grade_journeys" ADD COLUMN     "completionType" "completion_type";

-- CreateTable
CREATE TABLE "academic_year_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "startMonth" INTEGER NOT NULL DEFAULT 6,
    "startDay" INTEGER NOT NULL DEFAULT 1,
    "endMonth" INTEGER NOT NULL DEFAULT 5,
    "endDay" INTEGER NOT NULL DEFAULT 31,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_year_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_mastery_badges" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "gradeJourneyId" TEXT,
    "badgeType" "badge_type" NOT NULL DEFAULT 'MASTERY',
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requirements" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grade_mastery_badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academic_year_configs_tenantId_key" ON "academic_year_configs"("tenantId");

-- CreateIndex
CREATE INDEX "grade_mastery_badges_tenantId_idx" ON "grade_mastery_badges"("tenantId");

-- CreateIndex
CREATE INDEX "grade_mastery_badges_studentId_grade_idx" ON "grade_mastery_badges"("studentId", "grade");

-- CreateIndex
CREATE UNIQUE INDEX "grade_mastery_badges_studentId_grade_badgeType_key" ON "grade_mastery_badges"("studentId", "grade", "badgeType");

-- AddForeignKey
ALTER TABLE "academic_year_configs" ADD CONSTRAINT "academic_year_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_mastery_badges" ADD CONSTRAINT "grade_mastery_badges_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
