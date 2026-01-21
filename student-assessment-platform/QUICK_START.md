# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 15+ running (or connection string)
- Redis 7+ running (or connection string)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

✅ **Status**: Works cleanly

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL` - Your PostgreSQL connection string
- `REDIS_URL` - Your Redis connection string
- `NEXTAUTH_SECRET` - Generate a random secret (e.g., `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your application URL (e.g., `http://localhost:3000`)

### 3. Run Database Migrations

```bash
npx prisma migrate dev
```

This will:
- Create the database schema
- Generate Prisma Client
- Set up all tables with proper indexes

✅ **Status**: Works with Prisma 6 (direct database connection)

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at: http://localhost:3000

✅ **Status**: Works cleanly with Prisma 6

## Verification

After setup, verify:

1. **TypeScript Compilation**
   ```bash
   npx tsc --noEmit
   ```
   ✅ Should pass with no errors

2. **Build**
   ```bash
   npm run build
   ```
   ✅ Should build successfully

3. **Dev Server**
   ```bash
   npm run dev
   ```
   ✅ Should start on http://localhost:3000

## Current Configuration

- **Prisma**: 6.19.2 (Development)
- **Database**: Direct connection via `DATABASE_URL`
- **Redis**: Direct connection via `REDIS_URL`
- **Next.js**: 16.1.4

## Troubleshooting

### Database Connection Issues

If `npx prisma migrate dev` fails:
- Verify PostgreSQL is running
- Check `DATABASE_URL` format
- Ensure database exists (or Prisma will create it)

### Redis Connection Issues

If Redis errors occur:
- Verify Redis is running: `redis-cli ping`
- Check `REDIS_URL` format
- Redis is optional for build but required for runtime

### Build Errors

If `npm run build` fails:
- Ensure all environment variables are set (even dummy values for build)
- Check TypeScript errors: `npx tsc --noEmit`
- Verify all dependencies installed: `npm install`

## Next Steps

1. Set up your database and run migrations
2. Configure Redis
3. Start building features!

See `PRISMA_7_UPGRADE_TODO.md` for future Prisma 7 upgrade plans.

