# Explorer Mode - Career Catalog Seed Guide

## Overview

This guide walks you through seeding the CareerCatalog table with 50 careers for Explorer Mode.

## Prerequisites

1. **Database migration must be run first**:
   ```bash
   npx prisma migrate dev --name add_explorer_mode
   npx prisma generate
   ```

   This creates the new tables:
   - `daily_quest_sets`
   - `quest_attempts`
   - `career_catalog`
   - `career_unlocks`

2. **Environment variable**:
   ```bash
   EXPLORER_MODE=true
   ```

## Career Catalog

The career catalog contains **50 careers** with the following structure:

- **id**: Unique identifier (e.g., `software_engineer`)
- **title**: Career name (e.g., `Software Engineer`)
- **shortPitch**: 1-line inspiring description
- **dayInLife**: 2-3 sentence snapshot of a typical day
- **skillSignals**: Array of skill categories that match this career
- **recommendedSubjects**: Relevant school subjects
- **starterPathSteps**: Learning suggestions (not prescriptions)
- **icon**: Emoji or icon identifier
- **rarityTier**: `COMMON`, `EMERGING`, `ADVANCED`, or `FRONTIER`

## Seeding Steps

### Step 1: Run Migration

```bash
cd student-assessment-platform
npx prisma migrate dev --name add_explorer_mode
```

This will:
- Create the new tables in your database
- Generate Prisma Client with the new models

### Step 2: Generate Prisma Client

```bash
npx prisma generate
```

This regenerates the Prisma Client with the new models.

### Step 3: Seed Career Catalog

```bash
npm run db:seed-careers
```

Or directly:
```bash
npx tsx prisma/seed-careers.ts
```

### Step 4: Verify

Check that careers were seeded:
```bash
# Using psql
psql $DATABASE_URL -c "SELECT COUNT(*) FROM career_catalog;"
# Should return: 50

# Or check a few careers
psql $DATABASE_URL -c "SELECT id, title, \"rarityTier\" FROM career_catalog LIMIT 10;"
```

## Career Distribution

The 50 careers are distributed across rarity tiers:

- **COMMON** (~30 careers): Accessible, well-known careers
- **EMERGING** (~10 careers): Growing fields, modern careers
- **ADVANCED** (~8 careers): Specialized, requires advanced education
- **FRONTIER** (~2 careers): Cutting-edge, highly specialized

## Career Categories by Skill Signals

Careers are mapped to skill signals:

- **COGNITIVE_REASONING**: Software Engineer, Data Scientist, Engineer, Scientist, etc.
- **CREATIVITY**: Graphic Designer, Writer, Musician, Animator, etc.
- **LANGUAGE**: Teacher, Writer, Journalist, Translator, etc.
- **SOCIAL_EMOTIONAL**: Teacher, Psychologist, Social Worker, Therapist, etc.
- **PLANNING**: Architect, Engineer, Urban Planner, etc.
- **ATTENTION**: Data Scientist, Pilot, Forensic Scientist, etc.
- **METACOGNITION**: Teacher, Psychologist, Researcher, etc.
- **CHARACTER_VALUES**: Social Worker, Humanitarian Worker, etc.

## Troubleshooting

### Error: "Property 'careerCatalog' does not exist"

**Solution**: Run `npx prisma generate` after migration.

### Error: "Table 'career_catalog' does not exist"

**Solution**: Run `npx prisma migrate dev --name add_explorer_mode` first.

### Error: "Cannot find module '../lib/career-catalog'"

**Solution**: Ensure you're running from the project root:
```bash
cd student-assessment-platform
npx tsx prisma/seed-careers.ts
```

### Careers not appearing

**Check**:
1. Migration was successful
2. Prisma Client was regenerated
3. Seed script ran without errors
4. Database connection is correct

## Next Steps

After seeding:

1. **Set student to Explorer mode**:
   ```sql
   UPDATE student_profiles 
   SET "preferredMode" = 'EXPLORER' 
   WHERE "userId" = '<student_user_id>';
   ```

2. **Test Explorer Mode**:
   - Navigate to `/explorer`
   - Complete quests
   - Verify career unlocks

3. **Verify unlocks work**:
   - Complete a quest
   - Check if careers are unlocked
   - View `/explorer/unlocks`

## Files

- **Career Data**: `lib/career-catalog.ts` (50 careers)
- **Seed Script**: `prisma/seed-careers.ts`
- **Package Script**: `npm run db:seed-careers`

## Manual Verification

```sql
-- Count careers
SELECT COUNT(*) FROM career_catalog;

-- View all careers with rarity
SELECT id, title, "rarityTier", icon 
FROM career_catalog 
ORDER BY "rarityTier", title;

-- Check skill signals distribution
SELECT 
  unnest("skillSignals") as skill,
  COUNT(*) as career_count
FROM career_catalog
GROUP BY skill
ORDER BY career_count DESC;
```

