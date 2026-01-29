# Teacher Login Guide

## Quick Start

1. **Run Database Seed** (if not already done):
   ```bash
   npx prisma db seed
   ```

2. **Login as Teacher**:
   - Go to `/login`
   - Enter email: `teacher@test-school.com`
   - Enter the OTP code sent to your email (or check console logs in development)
   - You will be automatically redirected to `/teacher` (Teacher Portal)

## Test Accounts

After running the seed script, these test accounts are available:

| Role | Email | Password/OTP |
|------|-------|--------------|
| Teacher | `teacher@test-school.com` | OTP via email |
| Student | `student@test-school.com` | OTP via email |
| Parent | `parent@test-school.com` | OTP via email |
| School Admin | `admin@test-school.com` | OTP via email |

## Role-Based Redirects

After successful OTP verification, users are redirected based on their role:

- **TEACHER** → `/teacher` (Teacher Portal)
- **SCHOOL_ADMIN** → `/teacher` (Teacher Portal)
- **PARENT** → `/parent-tracker` (Parent Dashboard)
- **STUDENT** → `/dashboard` (Student Dashboard)
- **PLATFORM_ADMIN** → `/admin` (Platform Admin - if exists)

## Development Notes

### OTP in Development

In development mode, OTP codes are:
- Sent via email (if email service is configured)
- Logged to console (check server logs)
- Stored in Redis (or file-based cache fallback)

### Creating New Teacher Accounts

To create a new teacher account:

1. **Via Seed Script** (recommended for testing):
   ```typescript
   // Add to prisma/seed.ts
   const teacher = await prisma.user.create({
     data: {
       tenantId: schoolTenant.id,
       email: 'new-teacher@test-school.com',
       role: 'TEACHER',
       name: 'New Teacher',
     },
   });
   ```

2. **Via Database** (direct):
   ```sql
   INSERT INTO users (id, tenant_id, email, role, name, created_at, updated_at)
   VALUES (
     gen_random_uuid(),
     '<tenant-id>',
     'new-teacher@test-school.com',
     'TEACHER',
     'New Teacher',
     NOW(),
     NOW()
   );
   ```

3. **Via API** (future):
   - School admin can invite teachers via `/api/admin/invite-teacher`
   - Teacher receives invitation email
   - Teacher completes registration

## Troubleshooting

### "User not found" Error

- Ensure seed script has been run: `npx prisma db seed`
- Check that email matches exactly (case-sensitive)
- Verify user exists in database: `SELECT * FROM users WHERE email = 'teacher@test-school.com';`

### "OTP expired" Error

- OTP expires after 5 minutes
- Request a new OTP by clicking "Resend code"
- In development, check server logs for OTP value

### Redirect Not Working

- Check browser console for errors
- Verify user role in session: `localStorage.getItem('session')`
- Ensure teacher layout allows access: Check `app/(teacher)/layout.tsx`

### Teacher Portal Not Loading

- Verify teacher has active ClassSection (for grade filtering)
- Check that teacher routes are accessible: `/teacher`, `/teacher/settings`
- Ensure NextAuth session is properly set

## Next Steps

After logging in as teacher:

1. **Set up Class Focus** (optional):
   - Go to `/teacher/settings`
   - Apply a preset or customize skill priorities
   - Save Class Focus profile

2. **Create ClassSection** (required for grade filtering):
   - Via database or admin API
   - Assign students to ClassSection
   - Set grade (8, 9, or 10)

3. **View Class Dashboard**:
   - Go to `/teacher`
   - See class signals, student list, and quick actions

4. **Create Assignments**:
   - Go to `/teacher/assign`
   - Create assignment targeting class, group, or individual students
   - Quest selection will use Class Focus priorities

