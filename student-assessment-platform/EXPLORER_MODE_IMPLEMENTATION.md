# Explorer Mode v1 Implementation

## ✅ Implementation Status

### Completed

1. **Database Models** ✓
   - `DailyQuestSet` - Stores daily quest sets per student
   - `QuestAttempt` - Tracks quest completion attempts
   - `CareerCatalog` - Career definitions (30 careers)
   - `CareerUnlock` - Student career unlocks

2. **Career Catalog** ✓
   - 30 careers with full metadata
   - Skill signals, rarity tiers, starter paths
   - Located in `lib/career-catalog.ts`

3. **Quest Generation** ✓
   - Daily quest generator (3 quests per day)
   - Quest types: mini_game, reflection, choice_scenario
   - Deterministic based on studentId + date
   - Located in `lib/explorer-quests.ts`

4. **AI Insight Generator** ✓
   - Deterministic template-based insights
   - Growth-oriented language
   - Evidence-based observations
   - Located in `lib/explorer-insights.ts`

5. **Career Unlock Logic** ✓
   - Performance-based evaluation
   - Skill signal matching
   - Rarity tier consideration
   - Located in `lib/explorer-unlocks.ts`

6. **API Endpoints** ✓
   - `GET /api/explorer/today` - Get today's quests
   - `POST /api/explorer/quests/:questId/start` - Start quest
   - `POST /api/explorer/quests/:questId/submit` - Submit quest
   - `GET /api/explorer/unlocks` - Get unlocked careers
   - `GET /api/explorer/careers/:careerId` - Get career details

### Pending

1. **UI Pages** (Next step)
   - `/explorer` - Today's Quests hub
   - Quest runner (reuse assessment runner)
   - Results modal/page
   - `/explorer/unlocks` - Career unlock gallery
   - `/explorer/careers/:id` - Career detail page

2. **Database Migration**
   - Run `npx prisma migrate dev` to create new tables

3. **Career Catalog Seed**
   - Seed script to populate CareerCatalog table

4. **Feature Flag**
   - Add `EXPLORER_MODE=true` to `.env`
   - Guard routes and menu visibility

## Setup Instructions

### 1. Environment Variables

Add to `.env`:
```bash
EXPLORER_MODE=true
```

### 2. Database Migration

```bash
npx prisma migrate dev --name add_explorer_mode
npx prisma generate
```

### 3. Seed Career Catalog

Create and run a seed script to populate the `CareerCatalog` table with the 30 careers from `lib/career-catalog.ts`.

### 4. Set Student to Explorer Mode

Update student profile:
```sql
UPDATE student_profiles 
SET "preferredMode" = 'EXPLORER' 
WHERE "userId" = '<student_user_id>';
```

## Testing Steps

### 1. Setup
- Ensure `EXPLORER_MODE=true` in `.env`
- Run migrations
- Seed career catalog
- Set student to Explorer mode
- Restart dev server

### 2. Access Explorer Mode
- Login as student
- Navigate to `/explorer`
- Should see today's 3 quests

### 3. Complete Mini Game Quest
- Click "Start" on mini game quest
- Answer 6 questions
- Submit
- Should see AI insight
- May unlock 0-2 careers

### 4. Complete Reflection Quest
- Click "Start" on reflection quest
- Write reflection response
- Submit
- Should see AI insight

### 5. Complete Choice Scenario Quest
- Click "Start" on choice scenario
- Select a choice
- Submit
- Should see AI insight

### 6. View Unlocks
- Navigate to `/explorer/unlocks`
- Should see all unlocked careers
- Click on a career to see details

### 7. View Career Detail
- Navigate to `/explorer/careers/:careerId`
- Should see full career information
- Should show unlock reason if unlocked

## Files Created

### Database
- `prisma/schema.prisma` - Added Explorer Mode models

### Libraries
- `lib/career-catalog.ts` - 30 careers catalog
- `lib/explorer-quests.ts` - Quest generation
- `lib/explorer-insights.ts` - AI insight generator
- `lib/explorer-unlocks.ts` - Career unlock logic

### API Routes
- `app/api/explorer/today/route.ts`
- `app/api/explorer/quests/[questId]/start/route.ts`
- `app/api/explorer/quests/[questId]/submit/route.ts`
- `app/api/explorer/unlocks/route.ts`
- `app/api/explorer/careers/[careerId]/route.ts`

## Next Steps

1. Create UI pages (see TODO list)
2. Create career catalog seed script
3. Add feature flag checks to routes
4. Add Explorer mode link to dashboard/menu
5. Test full flow end-to-end

