# Prisma 7 Upgrade TODO

## Current Status

✅ **Using Prisma 6.19.2** for development  
📋 **Planned**: Upgrade to Prisma 7.x for production

## Why Prisma 7?

Prisma 7 introduces:
- **Prisma Accelerate**: Connection pooling and edge-ready queries
- **Better Performance**: Optimized query engine
- **Enhanced Type Safety**: Improved TypeScript support
- **New Features**: Advanced query capabilities

## Prisma 7 Requirements

Prisma 7 requires **one of the following**:

### Option 1: Prisma Accelerate (Recommended)

**Best for**: Production, high-traffic applications

1. **Sign up for Prisma Accelerate**
   - Visit: https://www.prisma.io/accelerate
   - Free tier available for development
   - Production pricing based on usage

2. **Get Accelerate URL**
   - Create a new project in Prisma Accelerate dashboard
   - Copy the Accelerate connection string
   - Format: `prisma://accelerate.prisma-data.net/?api_key=...`

3. **Update Environment Variables**
   ```env
   # Keep direct database URL for migrations
   DATABASE_URL="postgresql://user:pass@host:5432/db"
   
   # Add Accelerate URL for Prisma Client
   PRISMA_ACCELERATE_URL="prisma://accelerate.prisma-data.net/?api_key=..."
   ```

4. **Update `lib/db.ts`**
   ```typescript
   export const db = new PrismaClient({
     accelerateUrl: process.env.PRISMA_ACCELERATE_URL,
     log: process.env.NODE_ENV === 'development' 
       ? ['query', 'error', 'warn']
       : ['error'],
   });
   ```

5. **Update `prisma/schema.prisma`**
   ```prisma
   datasource db {
     provider = "postgresql"
     // Remove url - Prisma 7 reads from prisma.config.ts
   }
   ```

6. **Create `prisma.config.ts`** (if not exists)
   ```typescript
   import "dotenv/config";
   import { defineConfig } from "prisma/config";

   export default defineConfig({
     schema: "prisma/schema.prisma",
     migrations: {
       path: "prisma/migrations",
     },
     datasource: {
       url: process.env["DATABASE_URL"], // For migrations
     },
   });
   ```

### Option 2: Database Adapter

**Best for**: Direct database connections without Accelerate

1. **Install Adapter Package**
   ```bash
   npm install @prisma/adapter-postgresql pg
   ```

2. **Update `lib/db.ts`**
   ```typescript
   import { PrismaClient } from '@prisma/client';
   import { PrismaPostgresAdapter } from '@prisma/adapter-postgresql';
   import { Pool } from 'pg';

   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
   });

   const adapter = new PrismaPostgresAdapter(pool);

   export const db = new PrismaClient({
     adapter: adapter,
     log: process.env.NODE_ENV === 'development' 
       ? ['query', 'error', 'warn']
       : ['error'],
   });
   ```

3. **Update Schema and Config** (same as Option 1)

## Migration Steps

### Step 1: Update Dependencies

```bash
npm install prisma@latest @prisma/client@latest
```

### Step 2: Choose Configuration Option

- **Production**: Use Prisma Accelerate (Option 1)
- **Development**: Can use adapter (Option 2) or Accelerate

### Step 3: Update Code

1. Update `prisma/schema.prisma` (remove `url` from datasource)
2. Create/update `prisma.config.ts`
3. Update `lib/db.ts` with adapter or accelerateUrl
4. Update environment variables

### Step 4: Regenerate Prisma Client

```bash
npx prisma generate
```

### Step 5: Test Migrations

```bash
# Test migration (dry run)
npx prisma migrate dev --create-only

# Apply migration
npx prisma migrate dev
```

### Step 6: Test Application

```bash
npm run build
npm run dev
```

## Breaking Changes to Watch

1. **Schema Format**: `url` moved from schema to config
2. **Client Initialization**: Requires adapter or accelerateUrl
3. **Type Changes**: Some Prisma types may have changed
4. **Query Engine**: New query engine may have different behavior

## Testing Checklist

After upgrade, verify:

- [ ] `npx prisma generate` succeeds
- [ ] `npx prisma migrate dev` works
- [ ] `npm run build` compiles without errors
- [ ] `npm run dev` starts successfully
- [ ] Database queries work correctly
- [ ] All API routes function properly
- [ ] Multi-tenant isolation still works
- [ ] Row-Level Security policies intact

## Rollback Plan

If issues occur:

1. **Revert to Prisma 6**
   ```bash
   npm install prisma@^6.0.0 @prisma/client@^6.0.0
   ```

2. **Restore schema**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **Remove `prisma.config.ts`** (if created)

4. **Regenerate client**
   ```bash
   npx prisma generate
   ```

## Resources

- [Prisma 7 Upgrade Guide](https://www.prisma.io/docs/guides/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [Prisma Accelerate Documentation](https://www.prisma.io/docs/accelerate)
- [Prisma 7 Release Notes](https://github.com/prisma/prisma/releases)

## Timeline

- **Current**: Prisma 6.19.2 (Development)
- **Target**: Prisma 7.x (Before Production Launch)
- **Priority**: Medium (Can stay on Prisma 6 for MVP)

## Notes

- Prisma 6 is stable and sufficient for MVP development
- Prisma 7 upgrade can be done before production launch
- Accelerate provides significant performance benefits for production
- Consider testing Prisma 7 in staging environment first

---

**Last Updated**: January 2026  
**Status**: Planned for pre-production upgrade

