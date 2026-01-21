/**
 * Simple Database Seed Script
 * 
 * Creates one tenant + one student for testing.
 * 
 * Run with: npx tsx prisma/seed-simple.ts
 * 
 * @module prisma/seed-simple
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting simple database seed...');

  // Create test school tenant
  console.log('Creating test school tenant...');
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'test-school' },
    update: {},
    create: {
      name: 'Test School',
      type: 'SCHOOL',
      subdomain: 'test-school',
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
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        maxStudents: 1000,
      },
      dataRetentionDays: 730,
      isActive: true,
    },
  });
  console.log('✅ Tenant created:', tenant.id);

  // Create student user
  console.log('Creating student user...');
  const studentUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'student@test-school.com',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
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
      tenantId: tenant.id,
      grade: 9,
      section: 'A',
      dateOfBirth: new Date('2010-05-15'),
      parentIds: [],
      teacherIds: [],
      goals: ['Improve logical reasoning', 'Explore creative fields'],
      preferredMode: null,
      onboardingComplete: false,
      assessmentComplete: false,
    },
  });
  console.log('✅ Student profile created:', studentProfile.id);

  console.log('\n✅ Simple seed completed successfully!');
  console.log('\n📋 Test User:');
  console.log('  Email: student@test-school.com');
  console.log('  Role: STUDENT');
  console.log('  Tenant: test-school');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

