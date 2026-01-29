-- CreateTable
CREATE TABLE "teacher_profiles" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "phone" TEXT,
    "subjectsTaught" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "roleLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_settings" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assignmentDefaults" JSONB NOT NULL DEFAULT '{}',
    "notificationPrefs" JSONB NOT NULL DEFAULT '{}',
    "reportPrefs" JSONB NOT NULL DEFAULT '{}',
    "privacyPrefs" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teacher_profiles_teacherId_key" ON "teacher_profiles"("teacherId");

-- CreateIndex
CREATE INDEX "teacher_profiles_tenantId_teacherId_idx" ON "teacher_profiles"("tenantId", "teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_settings_teacherId_key" ON "teacher_settings"("teacherId");

-- CreateIndex
CREATE INDEX "teacher_settings_tenantId_teacherId_idx" ON "teacher_settings"("tenantId", "teacherId");
