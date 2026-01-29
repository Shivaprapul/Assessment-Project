-- CreateEnum
CREATE TYPE "group_type" AS ENUM ('MANUAL', 'SMART');

-- CreateEnum
CREATE TYPE "assignment_target" AS ENUM ('CLASS', 'GROUP', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "assignment_intent" AS ENUM ('IMPROVE_FOCUS', 'STRENGTHEN_PLANNING', 'ENCOURAGE_COMMUNICATION', 'BUILD_CONSISTENCY', 'PREPARE_FOR_EXAMS', 'REENGAGE_PARTICIPATION');

-- CreateEnum
CREATE TYPE "assignment_status" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');

-- CreateTable
CREATE TABLE "class_focus_profiles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "grade" INTEGER,
    "classId" TEXT,
    "focusWindow" JSONB NOT NULL DEFAULT '{}',
    "priorityBoosts" JSONB NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_focus_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_groups" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "group_type" NOT NULL DEFAULT 'MANUAL',
    "description" TEXT,
    "studentIds" TEXT[],
    "criteria" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetType" "assignment_target" NOT NULL DEFAULT 'CLASS',
    "targetIds" TEXT[],
    "questCount" INTEGER NOT NULL DEFAULT 4,
    "questTypes" TEXT[],
    "gradeScope" INTEGER,
    "intent" "assignment_intent",
    "dueDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "groupId" TEXT,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_attempts" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "questAttemptId" TEXT,
    "status" "assignment_status" NOT NULL DEFAULT 'PENDING',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "assignment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "class_focus_profiles_tenantId_teacherId_idx" ON "class_focus_profiles"("tenantId", "teacherId");

-- CreateIndex
CREATE INDEX "class_focus_profiles_tenantId_grade_idx" ON "class_focus_profiles"("tenantId", "grade");

-- CreateIndex
CREATE INDEX "student_groups_tenantId_teacherId_idx" ON "student_groups"("tenantId", "teacherId");

-- CreateIndex
CREATE INDEX "assignments_tenantId_teacherId_idx" ON "assignments"("tenantId", "teacherId");

-- CreateIndex
CREATE INDEX "assignments_tenantId_targetType_idx" ON "assignments"("tenantId", "targetType");

-- CreateIndex
CREATE INDEX "assignment_attempts_tenantId_assignmentId_idx" ON "assignment_attempts"("tenantId", "assignmentId");

-- CreateIndex
CREATE INDEX "assignment_attempts_studentId_assignmentId_idx" ON "assignment_attempts"("studentId", "assignmentId");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "student_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_attempts" ADD CONSTRAINT "assignment_attempts_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_attempts" ADD CONSTRAINT "assignment_attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
