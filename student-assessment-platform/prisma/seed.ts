/**
 * Database Seed Script
 * 
 * Seeds the database with:
 * - Platform admin tenant
 * - Test school tenant
 * - Test users (student, parent, teacher, admin)
 * 
 * Run with: npx tsx prisma/seed.ts
 * 
 * @module prisma/seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================
  // STEP 1: CREATE PLATFORM ADMIN TENANT
  // ============================================
  console.log('Creating platform admin tenant...');
  const platformTenant = await prisma.tenant.upsert({
    where: { subdomain: 'platform' },
    update: {},
    create: {
      name: 'Platform Administration',
      type: 'B2C',
      subdomain: 'platform',
      branding: {
        logo: '',
        primaryColor: '#3b82f6',
        secondaryColor: '#22c55e',
      },
      features: {
        explorerMode: true,
        facilitatorMode: true,
        behavioralTimeline: true,
      },
      subscription: {
        plan: 'premium',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        maxStudents: 10000,
      },
      dataRetentionDays: 730,
      isActive: true,
    },
  });
  console.log('✅ Platform tenant created:', platformTenant.id);

  // ============================================
  // STEP 2: CREATE TEST SCHOOL TENANT
  // ============================================
  console.log('Creating test school tenant...');
  const schoolTenant = await prisma.tenant.upsert({
    where: { subdomain: 'test-school' },
    update: {},
    create: {
      name: 'Test International School',
      type: 'SCHOOL',
      subdomain: 'test-school',
      branding: {
        logo: '',
        primaryColor: '#1e40af',
        secondaryColor: '#3b82f6',
      },
      features: {
        explorerMode: true,
        facilitatorMode: true,
        behavioralTimeline: true,
      },
      subscription: {
        plan: 'premium',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        maxStudents: 1000,
      },
      dataRetentionDays: 730,
      isActive: true,
    },
  });
  console.log('✅ School tenant created:', schoolTenant.id);

  // ============================================
  // STEP 3: CREATE PLATFORM ADMIN USER
  // ============================================
  console.log('Creating platform admin user...');
  const platformAdmin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: platformTenant.id,
        email: 'admin@platform.com',
      },
    },
    update: {},
    create: {
      tenantId: platformTenant.id,
      email: 'admin@platform.com',
      role: 'PLATFORM_ADMIN',
      name: 'Platform Administrator',
      metadata: {},
    },
  });
  console.log('✅ Platform admin created:', platformAdmin.email);

  // ============================================
  // STEP 4: CREATE SCHOOL ADMIN USER
  // ============================================
  console.log('Creating school admin user...');
  const schoolAdmin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: schoolTenant.id,
        email: 'admin@test-school.com',
      },
    },
    update: {},
    create: {
      tenantId: schoolTenant.id,
      email: 'admin@test-school.com',
      role: 'SCHOOL_ADMIN',
      name: 'School Administrator',
      metadata: {},
    },
  });
  console.log('✅ School admin created:', schoolAdmin.email);

  // ============================================
  // STEP 5: CREATE TEACHER USER
  // ============================================
  console.log('Creating teacher user...');
  const teacher = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: schoolTenant.id,
        email: 'teacher@test-school.com',
      },
    },
    update: {},
    create: {
      tenantId: schoolTenant.id,
      email: 'teacher@test-school.com',
      role: 'TEACHER',
      name: 'Test Teacher',
      metadata: {
        classes: ['Grade 9 - Section A'],
      },
    },
  });
  console.log('✅ Teacher created:', teacher.email);

  // ============================================
  // STEP 6: CREATE PARENT USER
  // ============================================
  console.log('Creating parent user...');
  const parent = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: schoolTenant.id,
        email: 'parent@test-school.com',
      },
    },
    update: {},
    create: {
      tenantId: schoolTenant.id,
      email: 'parent@test-school.com',
      role: 'PARENT',
      name: 'Test Parent',
      metadata: {},
    },
  });
  console.log('✅ Parent created:', parent.email);

  // ============================================
  // STEP 7: CREATE STUDENT USER & PROFILE
  // ============================================
  console.log('Creating student user...');
  const studentUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: schoolTenant.id,
        email: 'student@test-school.com',
      },
    },
    update: {},
    create: {
      tenantId: schoolTenant.id,
      email: 'student@test-school.com',
      role: 'STUDENT',
      name: 'Test Student',
      metadata: {},
    },
  });
  console.log('✅ Student user created:', studentUser.email);

  // Create student profile
  const studentProfile = await prisma.studentProfile.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      tenantId: schoolTenant.id,
      grade: 9,
      section: 'A',
      dateOfBirth: new Date('2010-05-15'),
      parentIds: [parent.id],
      teacherIds: [teacher.id],
      goals: ['Improve logical reasoning', 'Explore creative fields'],
      preferredMode: null,
      onboardingComplete: false,
      assessmentComplete: false,
    },
  });
  console.log('✅ Student profile created:', studentProfile.id);

  // ============================================
  // STEP 8: CREATE SECOND TENANT FOR ISOLATION TEST
  // ============================================
  console.log('Creating second tenant for isolation testing...');
  const schoolTenant2 = await prisma.tenant.upsert({
    where: { subdomain: 'test-school-2' },
    update: {},
    create: {
      name: 'Test School 2',
      type: 'SCHOOL',
      subdomain: 'test-school-2',
      branding: {
        logo: '',
        primaryColor: '#dc2626',
        secondaryColor: '#ef4444',
      },
      features: {
        explorerMode: true,
        facilitatorMode: true,
        behavioralTimeline: true,
      },
      subscription: {
        plan: 'basic',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        maxStudents: 500,
      },
      dataRetentionDays: 730,
      isActive: true,
    },
  });

  const student2 = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: schoolTenant2.id,
        email: 'student2@test-school-2.com',
      },
    },
    update: {},
    create: {
      tenantId: schoolTenant2.id,
      email: 'student2@test-school-2.com',
      role: 'STUDENT',
      name: 'Student from Tenant 2',
      metadata: {},
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: student2.id },
    update: {},
    create: {
      userId: student2.id,
      tenantId: schoolTenant2.id,
      grade: 8,
      section: 'B',
      dateOfBirth: new Date('2011-06-20'),
      parentIds: [],
      teacherIds: [],
      goals: [],
      preferredMode: null,
      onboardingComplete: false,
      assessmentComplete: false,
    },
  });
  console.log('✅ Second tenant and student created for isolation testing');

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📋 Test Users Created:');
  console.log('  Platform Admin: admin@platform.com');
  console.log('  School Admin:   admin@test-school.com');
  console.log('  Teacher:        teacher@test-school.com');
  console.log('  Parent:         parent@test-school.com');
  console.log('  Student:        student@test-school.com');
  console.log('  Student 2:      student2@test-school-2.com (for isolation testing)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

