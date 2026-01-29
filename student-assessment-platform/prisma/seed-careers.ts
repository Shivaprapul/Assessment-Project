/**
 * Career Catalog Seed Script
 * 
 * Seeds the CareerCatalog table with 50 careers for Explorer Mode.
 * 
 * Run with: npx tsx prisma/seed-careers.ts
 * 
 * @module prisma/seed-careers
 */

import { PrismaClient, RarityTier } from '@prisma/client';
import { CAREER_CATALOG } from '../lib/career-catalog';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting career catalog seed...');
  console.log(`📋 Seeding ${CAREER_CATALOG.length} careers...`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const career of CAREER_CATALOG) {
    try {
      const result = await prisma.careerCatalog.upsert({
        where: { id: career.id },
        update: {
          title: career.title,
          shortPitch: career.shortPitch,
          dayInLife: career.dayInLife,
          skillSignals: career.skillSignals,
          recommendedSubjects: career.recommendedSubjects,
          starterPathSteps: career.starterPathSteps,
          icon: career.icon,
          rarityTier: career.rarityTier as RarityTier,
          isActive: true,
        },
        create: {
          id: career.id,
          title: career.title,
          shortPitch: career.shortPitch,
          dayInLife: career.dayInLife,
          skillSignals: career.skillSignals,
          recommendedSubjects: career.recommendedSubjects,
          starterPathSteps: career.starterPathSteps,
          icon: career.icon,
          rarityTier: career.rarityTier as RarityTier,
          isActive: true,
        },
      });

      if (result) {
        // Check if it was created or updated by checking if it existed before
        const existing = await prisma.careerCatalog.findUnique({
          where: { id: career.id },
        });
        if (existing && existing.createdAt.getTime() === existing.updatedAt.getTime()) {
          created++;
        } else {
          updated++;
        }
      }
    } catch (error: any) {
      console.error(`❌ Error seeding career ${career.id}:`, error.message);
      skipped++;
    }
  }

  console.log('\n✅ Career catalog seed completed!');
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${CAREER_CATALOG.length}`);

  // Verify count
  const count = await prisma.careerCatalog.count();
  console.log(`\n📊 Total careers in database: ${count}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

