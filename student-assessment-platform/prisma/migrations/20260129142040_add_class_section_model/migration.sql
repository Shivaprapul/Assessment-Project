-- AlterTable
ALTER TABLE "student_profiles" ADD COLUMN     "classSectionId" TEXT;

-- CreateTable
CREATE TABLE "class_sections" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "teacherId" TEXT NOT NULL,
    "academicYearStart" DATE NOT NULL,
    "academicYearEnd" DATE NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "class_sections_tenantId_grade_idx" ON "class_sections"("tenantId", "grade");

-- CreateIndex
CREATE INDEX "class_sections_tenantId_teacherId_idx" ON "class_sections"("tenantId", "teacherId");

-- CreateIndex
CREATE INDEX "class_sections_tenantId_academicYearStart_academicYearEnd_idx" ON "class_sections"("tenantId", "academicYearStart", "academicYearEnd");

-- CreateIndex
CREATE INDEX "student_profiles_classSectionId_idx" ON "student_profiles"("classSectionId");

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_classSectionId_fkey" FOREIGN KEY ("classSectionId") REFERENCES "class_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sections" ADD CONSTRAINT "class_sections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sections" ADD CONSTRAINT "class_sections_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
