# Teacher Portal UI Improvements

## Summary
Implemented dummy student data and teacher header dropdown menu.

## A) Dummy Student Data ✅

### Implementation
- **File**: `lib/demo/teacher-demo-data.ts`
- **Functions**:
  - `generateDemoStudents(grade, count)` - Generates 10 realistic students
  - `generateDemoClassSignals()` - Generates class insights
  - `generateDemoGroups()` - Generates student groups

### Demo Mode Flag
- **Environment Variable**: `DEMO_TEACHER=true` (default: false)
- **Where Checked**:
  1. `app/api/teacher/students/route.ts` - Returns demo students when flag is true
  2. `app/api/teacher/class-signals/route.ts` - Returns demo signals when flag is true
  3. `app/api/teacher/groups/route.ts` - Returns demo groups when flag is true

### Demo Data Features
- **10 Students** with realistic names (Arjun Sharma, Priya Patel, etc.)
- **Grade-aware**: Uses teacher's ClassSection.grade or defaults to 9
- **Realistic Stats**:
  - Last active dates (0-14 days ago)
  - Weekly quest completion (0-7 quests)
  - Status: active, needs_nudge, or new_joiner
  - 2-3 skill highlights per student
  - Section assignment (A, B, or C)
- **Student IDs**: `demo-student-1` through `demo-student-10`
- **Avatar Initials**: Generated from student names

### How to Enable/Disable

**Enable Demo Mode:**
```bash
# In .env.local or .env
DEMO_TEACHER=true
```

**Disable Demo Mode:**
```bash
# In .env.local or .env
DEMO_TEACHER=false
# Or remove the variable (defaults to false)
```

**Restart dev server after changing:**
```bash
npm run dev
```

### UI Behavior
- Demo students display with initials in avatar circles
- All navigation works (clicking student → `/teacher/students/:id`)
- Sorting and filtering work the same as real data
- Class signals show realistic insights
- Groups show smart and manual groups

## B) Teacher Header Dropdown ✅

### Implementation
- **File**: `components/TeacherHeader.tsx`
- **Components Used**: shadcn/ui DropdownMenu, Avatar

### Features
- **Left Side**: "Teacher Portal" title (unchanged)
- **Right Side**: 
  - Teacher avatar (image if available, else initials)
  - Teacher name (visible on desktop, hidden on mobile)
  - Dropdown menu with:
    1. **Settings** → Routes to `/teacher/settings`
    2. **Logout** → Signs out and redirects to `/login`

### Logout Implementation
- Calls `/api/auth/signout` (NextAuth endpoint)
- Clears localStorage session data
- Redirects to `/login`
- Keyboard accessible (Tab, Enter, Escape)

### Updated Pages
All teacher pages now use `TeacherHeader`:
- `/teacher` → `app/(teacher)/teacher/page.tsx`
- `/teacher/groups` → `app/(teacher)/teacher/groups/page.tsx`
- `/teacher/assign` → `app/(teacher)/teacher/assign/page.tsx`
- `/teacher/settings` → `app/(teacher)/teacher/settings/page.tsx`

### Avatar Display
- Shows teacher's avatar image if available
- Falls back to initials (first letter of first + last name)
- Blue background with white text for initials
- Responsive: name hidden on mobile, visible on desktop

## Acceptance Criteria ✅

### With DEMO_TEACHER=true:
- ✅ Teacher dashboard shows 10 students with realistic dummy stats
- ✅ Class signals show consistent mock outputs
- ✅ Groups show mock smart/manual groups
- ✅ Student drilldown navigation works with demo IDs
- ✅ All UI interactions work (sorting, filtering, etc.)

### With DEMO_TEACHER=false:
- ✅ Behavior unchanged (real APIs return real data)
- ✅ No demo data shown

### Teacher Header:
- ✅ Shows avatar dropdown with Settings + Logout
- ✅ Settings navigates to `/teacher/settings`
- ✅ Logout ends session and redirects to `/login`
- ✅ Keyboard accessible
- ✅ Responsive (name hidden on mobile)

## File Changes

### New Files:
1. `lib/demo/teacher-demo-data.ts` - Demo data generator
2. `components/TeacherHeader.tsx` - Teacher header component

### Modified Files:
1. `app/api/teacher/students/route.ts` - Added demo mode check
2. `app/api/teacher/class-signals/route.ts` - Added demo mode check
3. `app/api/teacher/groups/route.ts` - Added demo mode check
4. `app/(teacher)/teacher/page.tsx` - Uses TeacherHeader, shows demo avatars
5. `app/(teacher)/teacher/groups/page.tsx` - Uses TeacherHeader
6. `app/(teacher)/teacher/assign/page.tsx` - Uses TeacherHeader
7. `app/(teacher)/teacher/settings/page.tsx` - Uses TeacherHeader

## Testing

### Test Demo Mode:
1. Set `DEMO_TEACHER=true` in `.env.local`
2. Restart dev server: `npm run dev`
3. Login as teacher: `teacher@test-school.com`
4. Verify:
   - Dashboard shows 10 students
   - Students have initials in avatars
   - Class signals show insights
   - Groups show mock groups
   - Clicking student navigates correctly

### Test Real Mode:
1. Set `DEMO_TEACHER=false` or remove variable
2. Restart dev server
3. Login as teacher
4. Verify real data is shown (or empty if no students)

### Test Header:
1. Login as teacher
2. Verify avatar dropdown appears
3. Click Settings → Should navigate to `/teacher/settings`
4. Click Logout → Should sign out and redirect to `/login`
5. Test keyboard navigation (Tab, Enter, Escape)

## Notes

- Demo data is deterministic (same input = same output)
- Demo student IDs are prefixed with `demo-` for easy identification
- Demo mode can be easily removed later by deleting `lib/demo/teacher-demo-data.ts` and removing the checks
- Teacher header is reusable across all teacher pages
- Logout uses NextAuth signout endpoint for proper session cleanup

