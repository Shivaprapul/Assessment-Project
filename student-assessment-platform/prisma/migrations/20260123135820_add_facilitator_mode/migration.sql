-- CreateEnum
CREATE TYPE "goal_type" AS ENUM ('CURATED', 'CAREER_CATALOG', 'CUSTOM');

-- CreateTable
CREATE TABLE "facilitator_goals" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "goalTitle" TEXT NOT NULL,
    "goalType" "goal_type" NOT NULL DEFAULT 'CURATED',
    "careerId" TEXT,
    "timeAvailability" INTEGER NOT NULL DEFAULT 20,
    "focusAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "goalReadiness" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "lastReadinessCalc" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facilitator_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_plans" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "weekStartDate" DATE NOT NULL,
    "weekEndDate" DATE NOT NULL,
    "focusSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dailyTimeBudget" INTEGER NOT NULL DEFAULT 20,
    "dailyPlan" JSONB NOT NULL DEFAULT '[]',
    "goalReadinessDelta" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "facilitator_goals_studentId_key" ON "facilitator_goals"("studentId");

-- CreateIndex
CREATE INDEX "facilitator_goals_tenantId_idx" ON "facilitator_goals"("tenantId");

-- CreateIndex
CREATE INDEX "weekly_plans_tenantId_weekStartDate_idx" ON "weekly_plans"("tenantId", "weekStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_plans_studentId_weekStartDate_key" ON "weekly_plans"("studentId", "weekStartDate");

-- AddForeignKey
ALTER TABLE "facilitator_goals" ADD CONSTRAINT "facilitator_goals_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_plans" ADD CONSTRAINT "weekly_plans_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
