-- CreateEnum
CREATE TYPE "grade_status" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "assessment_attempts" ADD COLUMN     "gradeAtTimeOfAttempt" INTEGER;

-- AlterTable
ALTER TABLE "daily_quest_sets" ADD COLUMN     "gradeAtCreation" INTEGER;

-- AlterTable
ALTER TABLE "quest_attempts" ADD COLUMN     "gradeAtTimeOfAttempt" INTEGER;

-- AlterTable
ALTER TABLE "student_profiles" ADD COLUMN     "currentGrade" INTEGER NOT NULL DEFAULT 8;

-- CreateTable
CREATE TABLE "grade_journeys" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "completionStatus" "grade_status" NOT NULL DEFAULT 'IN_PROGRESS',
    "summarySnapshot" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_journeys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "grade_journeys_studentId_idx" ON "grade_journeys"("studentId");

-- CreateIndex
CREATE INDEX "grade_journeys_tenantId_grade_idx" ON "grade_journeys"("tenantId", "grade");

-- CreateIndex
CREATE INDEX "grade_journeys_studentId_grade_idx" ON "grade_journeys"("studentId", "grade");

-- CreateIndex
CREATE INDEX "assessment_attempts_gradeAtTimeOfAttempt_idx" ON "assessment_attempts"("gradeAtTimeOfAttempt");

-- CreateIndex
CREATE INDEX "daily_quest_sets_gradeAtCreation_idx" ON "daily_quest_sets"("gradeAtCreation");

-- CreateIndex
CREATE INDEX "quest_attempts_gradeAtTimeOfAttempt_idx" ON "quest_attempts"("gradeAtTimeOfAttempt");

-- CreateIndex
CREATE INDEX "student_profiles_currentGrade_idx" ON "student_profiles"("currentGrade");

-- AddForeignKey
ALTER TABLE "grade_journeys" ADD CONSTRAINT "grade_journeys_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
