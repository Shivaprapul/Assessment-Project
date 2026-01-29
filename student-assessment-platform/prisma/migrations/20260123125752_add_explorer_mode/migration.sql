-- CreateEnum
CREATE TYPE "quest_type" AS ENUM ('MINI_GAME', 'REFLECTION', 'CHOICE_SCENARIO');

-- CreateEnum
CREATE TYPE "rarity_tier" AS ENUM ('COMMON', 'EMERGING', 'ADVANCED', 'FRONTIER');

-- CreateTable
CREATE TABLE "daily_quest_sets" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "mode" "mode" NOT NULL DEFAULT 'EXPLORER',
    "quests" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_quest_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quest_attempts" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "questSetId" TEXT,
    "questType" "quest_type" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "attempt_status" NOT NULL DEFAULT 'IN_PROGRESS',
    "telemetry" JSONB NOT NULL DEFAULT '{}',
    "scoreSummary" JSONB NOT NULL DEFAULT '{}',
    "aiInsight" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quest_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_catalog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortPitch" TEXT NOT NULL,
    "dayInLife" TEXT NOT NULL,
    "skillSignals" TEXT[],
    "recommendedSubjects" TEXT[],
    "starterPathSteps" TEXT[],
    "icon" TEXT,
    "rarityTier" "rarity_tier" NOT NULL DEFAULT 'COMMON',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_unlocks" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reasonEvidence" JSONB NOT NULL DEFAULT '{}',
    "linkedSkills" TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "career_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_quest_sets_tenantId_date_idx" ON "daily_quest_sets"("tenantId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_quest_sets_studentId_date_mode_key" ON "daily_quest_sets"("studentId", "date", "mode");

-- CreateIndex
CREATE INDEX "quest_attempts_studentId_status_idx" ON "quest_attempts"("studentId", "status");

-- CreateIndex
CREATE INDEX "quest_attempts_tenantId_idx" ON "quest_attempts"("tenantId");

-- CreateIndex
CREATE INDEX "quest_attempts_questId_idx" ON "quest_attempts"("questId");

-- CreateIndex
CREATE INDEX "career_catalog_rarityTier_idx" ON "career_catalog"("rarityTier");

-- CreateIndex
CREATE INDEX "career_unlocks_tenantId_idx" ON "career_unlocks"("tenantId");

-- CreateIndex
CREATE INDEX "career_unlocks_unlockedAt_idx" ON "career_unlocks"("unlockedAt");

-- CreateIndex
CREATE UNIQUE INDEX "career_unlocks_studentId_careerId_key" ON "career_unlocks"("studentId", "careerId");

-- AddForeignKey
ALTER TABLE "daily_quest_sets" ADD CONSTRAINT "daily_quest_sets_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_attempts" ADD CONSTRAINT "quest_attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_unlocks" ADD CONSTRAINT "career_unlocks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_unlocks" ADD CONSTRAINT "career_unlocks_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "career_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
