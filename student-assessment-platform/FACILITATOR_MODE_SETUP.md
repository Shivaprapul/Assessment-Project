# Facilitator Mode Setup Guide

## Prerequisites

1. **Database Migration**: Run the migration to create new tables:
   ```bash
   npx prisma migrate dev --name add_facilitator_mode
   npx prisma generate
   ```

2. **Environment Variable**: Add to `.env`:
   ```bash
   FACILITATOR_MODE=true
   ```

## Database Models Added

- `FacilitatorGoal` - Stores student's goal, time availability, focus areas
- `WeeklyPlan` - Stores 7-day training plans
- `DailyQuestSet` - Already exists, supports FACILITATOR mode

## APIs Created

1. **POST /api/facilitator/goal** - Set/update facilitator goal
2. **GET /api/facilitator/goal** - Get current goal
3. **GET /api/facilitator/week** - Get weekly plan
4. **GET /api/facilitator/today** - Get today's quests
5. **POST /api/facilitator/quests/:questId/start** - Start quest
6. **POST /api/facilitator/quests/:questId/submit** - Submit quest
7. **GET /api/facilitator/progress** - Get progress (readiness, streak, skills)

## Libraries Created

- `lib/goal-skill-map.ts` - Goal skill mappings (IAS, Doctor, Software Engineer, Entrepreneur, CA)
- `lib/facilitator-weekly-plan.ts` - Weekly plan generator
- `lib/facilitator-coaching.ts` - Coaching insight generator
- `lib/facilitator-goal-readiness.ts` - Goal readiness calculator

## Next Steps

1. **Run Migration**: 
   ```bash
   npx prisma migrate dev --name add_facilitator_mode
   npx prisma generate
   ```

2. **Create UI Pages** (pending):
   - `/facilitator` - Main hub
   - `/facilitator/goal-setup` - Goal setup wizard
   - `/facilitator/week` - Weekly plan view
   - `/facilitator/quests/[questId]` - Quest runner (reuse explorer patterns)
   - `/facilitator/quests/[questId]/results` - Results page

3. **Test Flow**:
   - Set goal via API or UI
   - View weekly plan
   - Complete today's quests
   - View coaching insights
   - Check goal readiness progress

## Goal Skill Maps

Pre-configured for:
- IAS (Civil Services)
- Doctor
- Software Engineer
- Entrepreneur
- CA (Chartered Accountant)

Custom goals use keyword-based mapping or default balanced map.

