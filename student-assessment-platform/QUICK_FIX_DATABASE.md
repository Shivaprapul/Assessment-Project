# Quick Fix: Database Connection Error

## Problem
Getting "Network error" or "Database connection failed" when clicking "Send Login Code"

## Root Cause
PostgreSQL database is not running or DATABASE_URL points to wrong server.

## Solution

### Option 1: Start PostgreSQL (Recommended)

**macOS:**
```bash
# Check if PostgreSQL is installed
which psql

# Start PostgreSQL service
brew services start postgresql@15
# OR
pg_ctl -D /usr/local/var/postgres start
```

**Linux:**
```bash
sudo systemctl start postgresql
# OR
sudo service postgresql start
```

**Windows:**
```bash
# Start PostgreSQL service from Services panel
# OR
net start postgresql-x64-15
```

### Option 2: Update DATABASE_URL

Edit `.env` file and set correct DATABASE_URL:

```env
# Standard PostgreSQL connection
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Example:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/student_assessment"
```

### Option 3: Use Docker (Quick Setup)

```bash
# Start PostgreSQL in Docker
docker run --name postgres-dev \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=student_assessment \
  -p 5432:5432 \
  -d postgres:15

# Update .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/student_assessment"
```

### After Fixing Database

1. **Run migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

2. **Seed database:**
   ```bash
   npm run db:seed-simple
   ```

3. **Restart dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

4. **Test login:**
   - Go to http://localhost:3000/login
   - Enter: `student@test-school.com`
   - Should work now!

## Verify Database Connection

```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"
```

If this works, your database is accessible.

---

**Note**: Redis is optional - the app works without it (uses in-memory storage).

