-- CreateEnum
CREATE TYPE "tenant_type" AS ENUM ('SCHOOL', 'B2C');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('STUDENT', 'PARENT', 'TEACHER', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN');

-- CreateEnum
CREATE TYPE "mode" AS ENUM ('EXPLORER', 'FACILITATOR');

-- CreateEnum
CREATE TYPE "attempt_status" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "skill_category" AS ENUM ('COGNITIVE_REASONING', 'CREATIVITY', 'LANGUAGE', 'MEMORY', 'ATTENTION', 'PLANNING', 'SOCIAL_EMOTIONAL', 'METACOGNITION', 'CHARACTER_VALUES');

-- CreateEnum
CREATE TYPE "skill_level" AS ENUM ('EMERGING', 'DEVELOPING', 'PROFICIENT', 'ADVANCED');

-- CreateEnum
CREATE TYPE "trend" AS ENUM ('IMPROVING', 'STABLE', 'NEEDS_ATTENTION');

-- CreateEnum
CREATE TYPE "report_type" AS ENUM ('INITIAL_ASSESSMENT', 'MONTHLY_PROGRESS', 'GOAL_REVIEW');

-- CreateEnum
CREATE TYPE "event_type" AS ENUM ('ETHICAL_DECISION', 'REFLECTION', 'ADAPTABILITY', 'RISK_TAKING', 'EMPATHY', 'PERSISTENCE');

-- CreateEnum
CREATE TYPE "visibility" AS ENUM ('STUDENT_ONLY', 'STUDENT_AND_PARENT', 'ALL');

-- CreateEnum
CREATE TYPE "activity_type" AS ENUM ('DISCOVERY_QUEST', 'DAILY_CHALLENGE', 'SKILL_BUILDER', 'REFLECTION', 'MILESTONE');

-- CreateEnum
CREATE TYPE "consent_purpose" AS ENUM ('ASSESSMENT', 'DATA_PROCESSING', 'AI_ANALYSIS', 'PARENT_VISIBILITY', 'TEACHER_VISIBILITY', 'RESEARCH');

-- CreateEnum
CREATE TYPE "action" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT');

-- CreateEnum
CREATE TYPE "resource_type" AS ENUM ('STUDENT', 'ASSESSMENT', 'REPORT', 'CONSENT', 'ACTIVITY');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "tenant_type" NOT NULL,
    "subdomain" TEXT NOT NULL,
    "customDomain" TEXT,
    "branding" JSONB NOT NULL DEFAULT '{}',
    "features" JSONB NOT NULL DEFAULT '{}',
    "subscription" JSONB NOT NULL DEFAULT '{}',
    "dataRetentionDays" INTEGER NOT NULL DEFAULT 730,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "section" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "parentIds" TEXT[],
    "teacherIds" TEXT[],
    "goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredMode" "mode",
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "assessmentComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_attempts" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "attempt_status" NOT NULL DEFAULT 'IN_PROGRESS',
    "telemetry" JSONB NOT NULL DEFAULT '{}',
    "rawScores" JSONB NOT NULL DEFAULT '{}',
    "normalizedScores" JSONB NOT NULL DEFAULT '{}',
    "reflectionText" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "assessment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_scores" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "category" "skill_category" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "level" "skill_level" NOT NULL,
    "evidence" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "trend" "trend" NOT NULL,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "history" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "skill_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_reports" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reportType" "report_type" NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentInsights" JSONB NOT NULL DEFAULT '{}',
    "parentGuidance" JSONB NOT NULL DEFAULT '{}',
    "evidenceUsed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "ai_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavioral_events" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" "event_type" NOT NULL,
    "context" TEXT NOT NULL,
    "sourceGameId" TEXT,
    "studentChoice" TEXT NOT NULL,
    "aiAnalysis" JSONB NOT NULL DEFAULT '{}',
    "visibility" "visibility" NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "behavioral_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mode" TEXT[],
    "type" "activity_type" NOT NULL,
    "targetCategories" TEXT[],
    "difficulty" INTEGER NOT NULL,
    "estimatedTime" INTEGER NOT NULL,
    "content" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_attempts" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "mode" "mode" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "attempt_status" NOT NULL,
    "telemetry" JSONB NOT NULL DEFAULT '{}',
    "aiAssessment" JSONB,
    "reflectionText" TEXT,

    CONSTRAINT "activity_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectUserId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "purpose" "consent_purpose" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "action" NOT NULL,
    "resourceType" "resource_type" NOT NULL,
    "resourceId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_subdomain_key" ON "tenants"("subdomain");

-- CreateIndex
CREATE INDEX "tenants_subdomain_idx" ON "tenants"("subdomain");

-- CreateIndex
CREATE INDEX "users_tenantId_role_idx" ON "users"("tenantId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_email_key" ON "users"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");

-- CreateIndex
CREATE INDEX "student_profiles_tenantId_idx" ON "student_profiles"("tenantId");

-- CreateIndex
CREATE INDEX "student_profiles_grade_idx" ON "student_profiles"("grade");

-- CreateIndex
CREATE INDEX "assessment_attempts_studentId_gameId_idx" ON "assessment_attempts"("studentId", "gameId");

-- CreateIndex
CREATE INDEX "assessment_attempts_tenantId_idx" ON "assessment_attempts"("tenantId");

-- CreateIndex
CREATE INDEX "skill_scores_tenantId_idx" ON "skill_scores"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_scores_studentId_category_key" ON "skill_scores"("studentId", "category");

-- CreateIndex
CREATE INDEX "ai_reports_studentId_reportType_idx" ON "ai_reports"("studentId", "reportType");

-- CreateIndex
CREATE INDEX "ai_reports_tenantId_idx" ON "ai_reports"("tenantId");

-- CreateIndex
CREATE INDEX "behavioral_events_studentId_timestamp_idx" ON "behavioral_events"("studentId", "timestamp");

-- CreateIndex
CREATE INDEX "behavioral_events_tenantId_idx" ON "behavioral_events"("tenantId");

-- CreateIndex
CREATE INDEX "activities_tenantId_idx" ON "activities"("tenantId");

-- CreateIndex
CREATE INDEX "activities_difficulty_idx" ON "activities"("difficulty");

-- CreateIndex
CREATE INDEX "activity_attempts_studentId_mode_idx" ON "activity_attempts"("studentId", "mode");

-- CreateIndex
CREATE INDEX "activity_attempts_tenantId_idx" ON "activity_attempts"("tenantId");

-- CreateIndex
CREATE INDEX "consent_records_subjectUserId_purpose_idx" ON "consent_records"("subjectUserId", "purpose");

-- CreateIndex
CREATE INDEX "consent_records_tenantId_idx" ON "consent_records"("tenantId");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_timestamp_idx" ON "audit_logs"("tenantId", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_userId_timestamp_idx" ON "audit_logs"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_resourceType_resourceId_idx" ON "audit_logs"("resourceType", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_scores" ADD CONSTRAINT "skill_scores_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_reports" ADD CONSTRAINT "ai_reports_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavioral_events" ADD CONSTRAINT "behavioral_events_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_attempts" ADD CONSTRAINT "activity_attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_attempts" ADD CONSTRAINT "activity_attempts_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
