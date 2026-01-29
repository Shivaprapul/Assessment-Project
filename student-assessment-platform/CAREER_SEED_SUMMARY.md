# Career Catalog Seed - Quick Summary

## ✅ What's Ready

1. **50 Careers** defined in `lib/career-catalog.ts`
2. **Seed Script** created at `prisma/seed-careers.ts`
3. **Package Script** added: `npm run db:seed-careers`

## 🚀 Quick Start

### 1. Run Migration (Required First!)

```bash
npx prisma migrate dev --name add_explorer_mode
npx prisma generate
```

### 2. Seed Careers

```bash
npm run db:seed-careers
```

### 3. Verify

```bash
# Should show 50 careers
psql $DATABASE_URL -c "SELECT COUNT(*) FROM career_catalog;"
```

## 📊 Career Breakdown

- **Total**: 50 careers
- **COMMON**: ~30 careers (Software Engineer, Teacher, Nurse, etc.)
- **EMERGING**: ~10 careers (Product Manager, Ethical Hacker, etc.)
- **ADVANCED**: ~8 careers (Biomedical Engineer, Quantum Physicist, etc.)
- **FRONTIER**: ~2 careers (Robotics Engineer, Neuroscientist, etc.)

## ⚠️ Important Notes

1. **Migration must run first** - The tables don't exist until you run the migration
2. **Prisma Client must be regenerated** - Run `npx prisma generate` after migration
3. **Seed script is idempotent** - Safe to run multiple times (uses upsert)

## 📝 Career List (50 Total)

1. Software Engineer
2. Data Scientist
3. Graphic Designer
4. Teacher
5. Doctor
6. Architect
7. Writer
8. Psychologist
9. Chef
10. Engineer
11. Musician
12. Scientist
13. Lawyer
14. Entrepreneur
15. Veterinarian
16. Photographer
17. Social Worker
18. Professional Athlete
19. Nurse
20. Journalist
21. Environmental Scientist
22. Game Designer
23. Therapist
24. Pilot
25. Animator
26. Marine Biologist
27. Pastry Chef
28. Urban Planner
29. Astronomer
30. Forensic Scientist
31. Translator
32. Mechanical Engineer
33. Yoga Instructor
34. Product Manager
35. Marketing Specialist
36. Financial Analyst
37. Event Planner
38. Fitness Trainer
39. Interior Designer
40. Biomedical Engineer
41. Content Creator
42. Research Scientist
43. Humanitarian Worker
44. Robotics Engineer
45. Sustainability Consultant
46. Speech Therapist
47. Quantum Physicist
48. Ethical Hacker
49. Wildlife Photographer
50. Neuroscientist
51. Sports Coach
52. Industrial Designer
53. Cryptographer
54. Art Therapist

**Note**: Currently 54 careers in catalog. Adjust to exactly 50 if needed, or keep all 54.

## 🔍 Verification Queries

```sql
-- Count by rarity
SELECT "rarityTier", COUNT(*) 
FROM career_catalog 
GROUP BY "rarityTier";

-- View sample careers
SELECT id, title, icon, "rarityTier" 
FROM career_catalog 
ORDER BY "rarityTier", title 
LIMIT 20;
```

