# Troubleshooting Guide

## Common Issues and Solutions

### 1. Network Error on "Send Login Code"

**Error**: "Network error. Please try again."

**Possible Causes:**
1. Database not running or DATABASE_URL not set
2. Redis not running (optional in development)
3. Server not running

**Solutions:**

#### Check Database Connection
```bash
# Check if DATABASE_URL is set
grep DATABASE_URL .env

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"
```

If database is not accessible:
- Start PostgreSQL: `brew services start postgresql` (macOS) or your system's method
- Set DATABASE_URL in `.env`:
  ```
  DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
  ```

#### Check Redis (Optional for Development)
Redis is optional in development - the app will use in-memory fallback.

To enable Redis:
```bash
# Start Redis
redis-server

# Or with Homebrew (macOS)
brew services start redis
```

#### Restart Dev Server
After fixing environment variables:
```bash
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

### 2. "USER_NOT_FOUND" Error

**Error**: "Email not registered in system"

**Solution**: Seed the database
```bash
npm run db:seed-simple
```

This creates:
- Tenant: `test-school`
- User: `student@test-school.com`

### 3. "OTP_EXPIRED" or "INVALID_OTP" Error

**Causes:**
- OTP expired (5 minutes)
- Wrong OTP entered
- Redis not running (OTP stored in memory, lost on server restart)

**Solution:**
- Request a new OTP
- Check server console for OTP (if Redis not available)
- Start Redis for persistent OTP storage

### 4. Database Connection Errors

**Error**: "Database connection failed"

**Check:**
1. PostgreSQL is running
2. DATABASE_URL is correct in `.env`
3. Database exists (Prisma will create it if it doesn't exist)

**Test:**
```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"
```

### 5. Redis Connection Errors

**Note**: Redis is optional in development. The app will:
- Use in-memory storage if Redis is not available
- Log OTP to console
- Work for testing, but OTPs are lost on server restart

**To enable Redis:**
```bash
# Start Redis
redis-server

# Verify it's running
redis-cli ping
# Should return: PONG
```

### 6. TypeScript/Build Errors

**Solution:**
```bash
# Clean and rebuild
rm -rf .next node_modules
npm install
npm run build
```

## Quick Health Check

Run these commands to verify setup:

```bash
# 1. Check environment variables
cat .env | grep -E "DATABASE_URL|REDIS_URL"

# 2. Test database
psql $DATABASE_URL -c "SELECT 1;" 2>&1

# 3. Test Redis (optional)
redis-cli ping 2>&1

# 4. Check server
curl http://localhost:3000/api/auth/send-otp \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' 2>&1 | head -5
```

## Development Mode Notes

- **Database**: Required for user lookup
- **Redis**: Optional - uses in-memory fallback if not available
- **OTP Storage**: 
  - With Redis: Persistent, survives server restarts
  - Without Redis: In-memory, lost on server restart (check console for OTP)

---

**Last Updated**: January 2026

