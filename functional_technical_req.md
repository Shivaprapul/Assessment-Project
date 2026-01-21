# Functional and Technical Requirements

## Document Overview
This document provides comprehensive functional and technical requirements for the Student Assessment & Career Support Platform MVP. Each requirement includes acceptance criteria and implementation notes.

**Target Audience:** Engineering teams, QA, Product Managers, AI coding agents (Cursor)  
**Version:** 1.0  
**Last Updated:** January 2026

---

## 1. Multi-Tenancy Requirements

### FR-MT-001: Tenant Creation and Management
**Priority:** P0 (Critical)  
**User Story:** As a platform admin, I need to create and manage school tenants so that schools can operate independently.

**Functional Requirements:**
- Platform admin can create new tenant via admin dashboard
- Each tenant has: name, type (school/b2c), subdomain, branding config
- Tenant can be activated/suspended/deleted
- Tenant settings include: max students, feature flags, data retention days

**Technical Requirements:**
- Database table: `tenants` with fields as per data model
- API endpoints: POST /api/platform/tenants, GET /api/platform/tenants, PUT /api/platform/tenants/:id
- Unique constraint on subdomain
- Soft delete for tenants (retain data for 30 days)

**Acceptance Criteria:**
- ✅ Platform admin can create tenant with all required fields
- ✅ Subdomain uniqueness is enforced
- ✅ Tenant branding (logo, colors) is customizable
- ✅ Feature flags can be toggled per tenant
- ✅ Deleted tenants are soft-deleted with grace period

**Implementation Notes:**
```typescript
// prisma/schema.prisma
model Tenant {
  id                 String   @id @default(uuid())
  name               String
  type               TenantType
  subdomain          String   @unique
  customDomain       String?
  branding           Json     // { logo, primaryColor, secondaryColor }
  features           Json     // { explorerMode, facilitatorMode, etc }
  subscription       Json     // { plan, startDate, endDate, maxStudents }
  dataRetentionDays  Int      @default(730)
  isActive           Boolean  @default(true)
  deletedAt          DateTime?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

enum TenantType {
  SCHOOL
  B2C
}
```

---

### FR-MT-002: Tenant Isolation and Row-Level Security
**Priority:** P0 (Critical)  
**User Story:** As a platform, I must ensure that no tenant can access another tenant's data under any circumstances.

**Functional Requirements:**
- All database queries are automatically scoped to tenant_id
- Cross-tenant data access is impossible
- Tenant context is enforced at middleware level
- API responses never leak tenant_id of other tenants

**Technical Requirements:**
- PostgreSQL Row-Level Security (RLS) policies on all tables
- Middleware sets tenant context: `SET app.current_tenant = <tenant_id>`
- All tables have `tenant_id` column with NOT NULL constraint
- Automated tests verify tenant isolation

**Acceptance Criteria:**
- ✅ User from Tenant A cannot access data from Tenant B via API
- ✅ Database queries automatically filter by tenant_id
- ✅ Middleware rejects requests without valid tenant context
- ✅ Automated tests cover all critical endpoints for isolation
- ✅ SQL injection attempts cannot bypass tenant filtering

**Implementation Notes:**
```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON students
  USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Repeat for all tables: assessments, skill_scores, ai_reports, etc.
```

```typescript
// lib/middleware/tenant.ts
export async function withTenantContext(
  handler: (req: NextRequest, tenantId: string) => Promise<Response>
) {
  return async (req: NextRequest) => {
    const session = await getSession(req);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Set tenant context for Prisma/SQL
    await db.$executeRaw`SET app.current_tenant = ${session.user.tenantId}`;
    
    return handler(req, session.user.tenantId);
  };
}
```

---

### FR-MT-003: Tenant-Specific Feature Flags
**Priority:** P1 (High)  
**User Story:** As a platform admin, I need to enable/disable features per tenant for custom deployments.

**Functional Requirements:**
- Feature flags stored in tenant configuration
- Features can be toggled via admin dashboard
- Frontend respects feature flags (hide disabled features)
- Backend validates feature access before execution

**Technical Requirements:**
- Tenant.features JSON field stores boolean flags
- Middleware checks feature flags before allowing access
- Frontend fetches feature config on login
- Cache feature flags in Redis (15 min TTL)

**Acceptance Criteria:**
- ✅ Admin can toggle features for specific tenant
- ✅ Disabled features are hidden in UI
- ✅ API rejects requests to disabled features
- ✅ Feature flags update without code deployment
- ✅ Default feature set applied to new tenants

**Implementation Notes:**
```typescript
// lib/features.ts
export async function checkFeature(
  tenantId: string,
  feature: keyof TenantFeatures
): Promise<boolean> {
  const cached = await redis.get(`tenant:${tenantId}:features`);
  
  if (cached) {
    return JSON.parse(cached)[feature];
  }
  
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { features: true }
  });
  
  await redis.set(
    `tenant:${tenantId}:features`,
    JSON.stringify(tenant.features),
    'EX',
    900 // 15 min
  );
  
  return tenant.features[feature];
}
```

---

## 2. Authentication & Authorization Requirements

### FR-AUTH-001: Email + OTP Authentication
**Priority:** P0 (Critical)  
**User Story:** As a student, I want to log in using my email and a one-time password so I don't have to remember complex passwords.

**Functional Requirements:**
- User enters email on login page
- System sends 6-digit OTP to email
- OTP valid for 5 minutes
- User enters OTP to complete login
- After 3 failed attempts, account is temporarily locked (15 min)

**Technical Requirements:**
- Use NextAuth.js with custom provider
- Store OTP in Redis with 5-minute expiry
- SendGrid integration for email delivery
- Rate limiting: max 3 OTP requests per email per 15 min

**Acceptance Criteria:**
- ✅ OTP is sent within 5 seconds
- ✅ OTP is 6 digits and random
- ✅ OTP expires after 5 minutes
- ✅ Invalid OTP shows clear error message
- ✅ Account locks after 3 failed attempts
- ✅ Email template is branded and professional

**Implementation Notes:**
```typescript
// app/api/auth/send-otp/route.ts
import { sendEmail } from '@/lib/email';
import { redis } from '@/lib/redis';

export async function POST(req: Request) {
  const { email } = await req.json();
  
  // Rate limiting check
  const attempts = await redis.get(`otp:attempts:${email}`);
  if (attempts && parseInt(attempts) >= 3) {
    return Response.json(
      { error: 'Too many attempts. Try again in 15 minutes.' },
      { status: 429 }
    );
  }
  
  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store in Redis (5 min expiry)
  await redis.set(`otp:${email}`, otp, 'EX', 300);
  
  // Increment attempts counter
  await redis.incr(`otp:attempts:${email}`);
  await redis.expire(`otp:attempts:${email}`, 900); // 15 min
  
  // Send email
  await sendEmail({
    to: email,
    subject: 'Your Login Code',
    html: `<p>Your OTP is: <strong>${otp}</strong></p><p>Valid for 5 minutes.</p>`
  });
  
  return Response.json({ success: true });
}
```

---

### FR-AUTH-002: Role-Based Access Control (RBAC)
**Priority:** P0 (Critical)  
**User Story:** As a system, I need to ensure users can only access features appropriate to their role.

**Functional Requirements:**
- Roles: student, parent, teacher, school_admin, platform_admin
- Each role has specific permissions
- API endpoints check role before execution
- Frontend hides UI elements based on role

**Role Permissions:**

| Role | Permissions |
|------|-------------|
| **student** | View own profile, take assessments, view own reports, access activities |
| **parent** | View linked children's profiles, view reports (with consent), manage consent |
| **teacher** | View assigned classes, view student reports (if allowed), class analytics |
| **school_admin** | Manage school users, view school analytics, configure school settings, compliance reports |
| **platform_admin** | Manage all tenants, view all data (with audit), configure platform settings |

**Technical Requirements:**
- User.role enum in database
- Middleware checks user.role against required role for route
- Frontend uses `useRole()` hook to conditionally render

**Acceptance Criteria:**
- ✅ Student cannot access parent dashboard
- ✅ Parent cannot access teacher dashboard
- ✅ Teacher can only see assigned classes
- ✅ School admin can only manage own tenant
- ✅ Platform admin can access all tenants
- ✅ API returns 403 for unauthorized role access

**Implementation Notes:**
```typescript
// lib/middleware/rbac.ts
export function requireRole(...allowedRoles: UserRole[]) {
  return async (req: NextRequest) => {
    const session = await getSession(req);
    
    if (!session?.user?.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return NextResponse.next();
  };
}

// Usage in API route
export const GET = requireRole('student', 'parent')(async (req) => {
  // Handler logic
});
```

---

### FR-AUTH-003: Parental Consent Management
**Priority:** P0 (Critical - DPDP Compliance)  
**User Story:** As a parent, I need to provide explicit consent for my child's data processing.

**Functional Requirements:**
- Student account requires parental consent before activation
- Parent receives unique consent link via email
- Consent form clearly explains data usage purposes
- Parent can grant/withdraw consent at any time
- Consent is purpose-specific (assessment, AI analysis, visibility)
- All consent actions are logged with timestamp and IP

**Technical Requirements:**
- ConsentRecord table with purpose, granted, timestamp, IP
- Consent link expires after 7 days
- Middleware checks consent before allowing student actions
- Parent dashboard shows consent history

**Acceptance Criteria:**
- ✅ Student cannot take assessments without parental consent
- ✅ Consent form is in simple, clear language
- ✅ Parent can withdraw consent with one click
- ✅ Consent withdrawal takes effect immediately
- ✅ All consent actions are audit-logged
- ✅ Expired consent links show appropriate message

**Implementation Notes:**
```typescript
// lib/consent.ts
export async function checkConsent(
  studentId: string,
  purpose: ConsentPurpose
): Promise<boolean> {
  const consent = await db.consentRecord.findFirst({
    where: {
      subjectUserId: studentId,
      purpose,
      granted: true,
      withdrawnAt: null,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    }
  });
  
  return !!consent;
}

// Middleware for consent check
export async function requireConsent(purpose: ConsentPurpose) {
  return async (req: NextRequest) => {
    const session = await getSession(req);
    
    if (session?.user?.role === 'student') {
      const hasConsent = await checkConsent(session.user.id, purpose);
      
      if (!hasConsent) {
        return NextResponse.json(
          { error: 'Parental consent required' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.next();
  };
}
```

---

## 3. Student Assessment Requirements

### FR-ASSESS-001: Preliminary Assessment Flow (8 Games)
**Priority:** P0 (Critical)  
**User Story:** As a student, I want to complete engaging assessment games to discover my skills.

**Functional Requirements:**
- 8 games must be completed in order (can pause and resume)
- Each game has: instructions, play area, timer, progress indicator
- Game state is auto-saved every 30 seconds
- Student can pause and resume anytime
- After completion, student receives AI-generated report

**Game Requirements:**
1. **Pattern Forge:** Logical reasoning puzzles (8-10 min)
2. **Many Ways Builder:** Creative problem-solving (10-12 min)
3. **Story Lens:** Narrative writing from images (10 min)
4. **Visual Vault:** Visual memory challenges (6-8 min)
5. **Focus Sprint:** Attention and error detection (8 min)
6. **Mission Planner:** Planning and adaptation (10-12 min)
7. **Dilemma Compass:** Ethical decision-making (12-15 min)
8. **Replay & Reflect:** Metacognitive reflection (10 min)

**Technical Requirements:**
- Unified game engine framework
- JSON-driven game configuration
- WebSocket for real-time telemetry
- AssessmentAttempt table tracks progress
- Background job generates report after Game 8

**Acceptance Criteria:**
- ✅ Student can complete all 8 games in one or multiple sessions
- ✅ Game progress is saved automatically
- ✅ Games are visually engaging and age-appropriate
- ✅ Instructions are clear and concise
- ✅ Timer is visible but non-intrusive
- ✅ AI report is generated within 30 seconds of completion

**Implementation Notes:**
```typescript
// components/games/GameEngine.tsx
interface GameEngineProps {
  gameId: string;
  config: GameConfig;
  onComplete: (telemetry: GameTelemetry) => void;
}

export function GameEngine({ gameId, config, onComplete }: GameEngineProps) {
  const [state, setState] = useState(config.initialState);
  const [startTime] = useState(Date.now());
  
  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      await fetch(`/api/assessments/${attemptId}/update`, {
        method: 'PUT',
        body: JSON.stringify({ state, telemetry: capturetelemetry() })
      });
    }, 30000);
    
    return () => clearInterval(interval);
  }, [state]);
  
  // ... game rendering logic
}
```

---

### FR-ASSESS-002: Telemetry Capture
**Priority:** P0 (Critical)  
**User Story:** As a system, I need to capture detailed gameplay data for accurate assessment.

**Functional Requirements:**
- Capture all user interactions: clicks, keypresses, mouse movements
- Record time spent on each question/task
- Track errors, revisions, and self-corrections
- Capture decision sequences in multi-choice scenarios
- Record reflection text quality (word count, sentiment)

**Technical Requirements:**
- Telemetry data structure varies per game (flexible JSON)
- Send telemetry via WebSocket or batched HTTP
- Store in AssessmentAttempt.telemetry JSONB column
- No PII in telemetry (e.g., don't store exact reflection text in plain)

**Acceptance Criteria:**
- ✅ All critical user actions are logged
- ✅ Telemetry doesn't impact game performance
- ✅ Data is sufficient for AI analysis
- ✅ No sensitive data is unnecessarily captured
- ✅ Telemetry can be replayed for debugging

**Implementation Notes:**
```typescript
// lib/telemetry.ts
export class TelemetryCapture {
  private events: TelemetryEvent[] = [];
  
  logAction(action: string, data?: any) {
    this.events.push({
      timestamp: Date.now(),
      action,
      data
    });
  }
  
  getSummary(): GameTelemetry {
    return {
      totalTime: this.getTotalTime(),
      actions: this.events.length,
      errors: this.events.filter(e => e.action === 'error').length,
      revisions: this.events.filter(e => e.action === 'revise').length,
      hintsUsed: this.events.filter(e => e.action === 'hint').length,
      events: this.events
    };
  }
}
```

---

### FR-ASSESS-003: Score Normalization
**Priority:** P0 (Critical)  
**User Story:** As a system, I need to convert raw game scores into standardized skill scores (0-100).

**Functional Requirements:**
- Each game produces raw scores (e.g., 7/10 correct, 45 seconds avg time)
- Raw scores are normalized to 0-100 scale per category
- Normalization uses percentiles from calibration dataset
- Multiple games can contribute to same category
- Final category score is weighted average of game contributions

**Technical Requirements:**
- Normalization formulas stored in code (can be updated via config)
- Calibration data from pilot users
- SkillScore table stores normalized scores
- Normalization runs as part of AI report generation job

**Acceptance Criteria:**
- ✅ Scores are consistent across games
- ✅ Scores are age-appropriate (Grade 8-10 baseline)
- ✅ Edge cases handled (perfect score, zero score)
- ✅ Normalization is transparent (shows evidence)
- ✅ Can re-normalize if calibration data updates

**Implementation Notes:**
```typescript
// lib/scoring/normalize.ts
export function normalizeScore(
  rawScore: number,
  rawMax: number,
  category: SkillCategory
): number {
  // Simple percentile-based normalization
  const percentile = (rawScore / rawMax) * 100;
  
  // Apply category-specific curve
  const curve = NORMALIZATION_CURVES[category];
  return applyPercentileCurve(percentile, curve);
}

// Example: Pattern Forge contributes to Cognitive Reasoning
const patternForgeScore = normalizeScore(7, 10, 'cognitive_reasoning');
```

---

## 4. AI System Requirements

### FR-AI-001: AI Report Generation
**Priority:** P0 (Critical)  
**User Story:** As a student, I want to receive a personalized, AI-generated report that explains my strengths and growth areas.

**Functional Requirements:**
- Report generated after completing all 8 games
- Report includes: strengths, growth areas, recommendations, celebratory message
- Language is encouraging, growth-oriented, age-appropriate
- Report links evidence to observations (e.g., "In Pattern Forge, you solved 8/10 puzzles...")
- Separate section for parent guidance

**Technical Requirements:**
- Use Anthropic Claude 3.5 Sonnet via API
- Structured prompt with few-shot examples
- JSON response parsing
- Store in AIReport table
- Background job (BullMQ) with 30-second timeout

**Acceptance Criteria:**
- ✅ Report is generated within 30 seconds
- ✅ Language is positive and growth-focused
- ✅ No medical/psychiatric labels
- ✅ No career determinism (e.g., "You should be an engineer")
- ✅ Evidence is specific and accurate
- ✅ Parent guidance is actionable

**Implementation Notes:**
```typescript
// workers/ai-report-generator.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateStudentReport(studentId: string) {
  // Fetch assessment data
  const attempts = await db.assessmentAttempt.findMany({
    where: { studentId },
    include: { telemetry: true, scores: true }
  });
  
  // Build prompt
  const prompt = buildReportPrompt(attempts);
  
  // Call Claude API
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    temperature: 0.4,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });
  
  // Parse response
  const report = parseReportResponse(response.content[0].text);
  
  // Store in database
  await db.aIReport.create({
    data: {
      studentId,
      tenantId: student.tenantId,
      reportType: 'initial_assessment',
      studentInsights: report.studentInsights,
      parentGuidance: report.parentGuidance,
      evidenceUsed: attempts.map(a => a.id),
      metadata: {
        llmModel: 'claude-sonnet-4-20250514',
        promptVersion: '1.0',
        generationTime: Date.now() - startTime
      }
    }
  });
}
```

---

### FR-AI-002: Daily Activity Recommendations (Facilitator Mode)
**Priority:** P1 (High)  
**User Story:** As a student in Facilitator Mode, I want AI to recommend daily activities that help me achieve my goals.

**Functional Requirements:**
- AI analyzes student's skill gaps and goals
- Generates one daily challenge (10-15 min)
- Adapts difficulty based on previous performance
- Recommends skill builders for deeper practice
- Provides specific, actionable feedback after completion

**Technical Requirements:**
- AI worker runs nightly to pre-generate challenges
- Activity library with 50+ templates
- Difficulty progression algorithm
- Feedback generated via LLM after submission

**Acceptance Criteria:**
- ✅ Daily challenge is available by 6 AM local time
- ✅ Challenge difficulty adapts to student level
- ✅ Recommendations align with student goals
- ✅ Feedback is specific and actionable
- ✅ No repetition of same activity within 2 weeks

**Implementation Notes:**
```typescript
// lib/ai/recommend-activity.ts
export async function recommendDailyChallenge(studentId: string) {
  const student = await db.studentProfile.findUnique({
    where: { id: studentId },
    include: { skillScores: true, goals: true, activityHistory: true }
  });
  
  // Identify skill gaps
  const weakestSkill = student.skillScores
    .sort((a, b) => a.score - b.score)[0];
  
  // Get activity pool for that skill
  const activities = await db.activity.findMany({
    where: {
      targetCategories: { has: weakestSkill.category },
      difficulty: calculateOptimalDifficulty(student),
      id: { notIn: getRecentActivityIds(student.activityHistory) }
    }
  });
  
  // Use AI to select best match
  const recommendation = await selectBestActivity(activities, student);
  
  return recommendation;
}
```

---

### FR-AI-003: Behavioral Pattern Analysis
**Priority:** P1 (High)  
**User Story:** As a student, I want to see how my decision-making and behavior evolve over time.

**Functional Requirements:**
- AI identifies patterns in ethical choices, persistence, empathy, etc.
- Timeline shows key behavioral events
- AI provides insights on behavioral trends
- Privacy: Only visible to student and parent (with consent)

**Technical Requirements:**
- BehavioralEvent table stores events
- AI analyzes patterns across multiple assessments
- Timeline UI with event cards
- Separate AI prompt for behavioral insights

**Acceptance Criteria:**
- ✅ Patterns are identified across 3+ events
- ✅ Insights are evidence-based
- ✅ Language is sensitive and growth-focused
- ✅ Privacy controls are enforced
- ✅ Timeline is visually engaging

---

## 5. Explorer & Facilitator Mode Requirements

### FR-MODE-001: Mode Selection
**Priority:** P1 (High)  
**User Story:** As a student, I want to choose between exploring new skills or focusing on specific goals.

**Functional Requirements:**
- After initial assessment, student chooses mode
- Can switch modes anytime
- Both modes update same Skill Tree and Timeline
- Dashboard UI adapts to selected mode

**Technical Requirements:**
- StudentProfile.preferredMode field
- Mode-specific dashboard components
- Activity filtering based on mode
- Analytics track mode usage

**Acceptance Criteria:**
- ✅ Student can select mode after assessment
- ✅ Mode switch takes effect immediately
- ✅ Data flows between both modes
- ✅ Dashboard shows mode-appropriate content
- ✅ Mode preference is saved

---

### FR-MODE-002: Explorer Mode - Discovery Quests
**Priority:** P1 (High)  
**User Story:** As a student in Explorer Mode, I want to discover new interests through varied activities.

**Functional Requirements:**
- Grid of discovery quests (15-20 min each)
- AI suggests areas based on curiosity signals
- No fixed progression path
- Focus on breadth over depth
- Lightweight assessment (engagement, not scores)

**Technical Requirements:**
- Activity library with "discovery_quest" type
- AI analyzes exploration patterns
- No ranking or comparison
- Progress tracked for insights only

**Acceptance Criteria:**
- ✅ 20+ discovery quests available
- ✅ Quests span all skill categories
- ✅ AI suggests relevant quests
- ✅ No scores or grades shown
- ✅ Insights focus on interests discovered

---

### FR-MODE-003: Facilitator Mode - Daily Challenges
**Priority:** P1 (High)  
**User Story:** As a student in Facilitator Mode, I want structured daily practice to improve specific skills.

**Functional Requirements:**
- One daily challenge (10-15 min)
- Student sets skill goals
- Progressive difficulty
- Specific feedback after each challenge
- Weekly reflection checkpoints

**Technical Requirements:**
- Daily challenge generation (nightly job)
- Goal tracking UI
- Adaptive difficulty algorithm
- Feedback via LLM

**Acceptance Criteria:**
- ✅ New challenge available daily
- ✅ Difficulty adapts to performance
- ✅ Feedback is actionable
- ✅ Progress visualized in charts
- ✅ Weekly reflection prompts

---

## 6. Data Privacy & Compliance Requirements (DPDP Act 2023)

### FR-PRIVACY-001: Data Minimization
**Priority:** P0 (Critical - DPDP Compliance)  
**User Story:** As a platform, I must collect only the minimum data necessary for the stated purpose.

**Functional Requirements:**
- No unnecessary data collection (e.g., don't ask for address if not needed)
- Purpose-specific data collection
- Clear explanation of why each data point is needed

**Technical Requirements:**
- Database schema only includes necessary fields
- Forms have "why we ask" tooltips
- Data collection audit during design phase

**Acceptance Criteria:**
- ✅ No extraneous fields in user profile
- ✅ Each data point has documented purpose
- ✅ Optional fields are clearly marked
- ✅ Data collection is proportional to value

---

### FR-PRIVACY-002: Data Portability
**Priority:** P0 (Critical - DPDP Compliance)  
**User Story:** As a parent/student, I can download all my data in a standard format.

**Functional Requirements:**
- One-click data export from dashboard
- Export includes: profile, assessments, reports, timeline
- Format: JSON and PDF
- Export request fulfilled within 48 hours

**Technical Requirements:**
- Export job queue
- PDF generation library (puppeteer)
- S3 storage for export files
- Email notification when ready

**Acceptance Criteria:**
- ✅ Export button is prominent
- ✅ Export includes all personal data
- ✅ Format is machine-readable (JSON) and human-readable (PDF)
- ✅ Export delivered within 48 hours
- ✅ Export file is encrypted

**Implementation Notes:**
```typescript
// app/api/data/export/route.ts
export async function POST(req: Request) {
  const session = await getSession();
  const userId = session.user.id;
  
  // Enqueue export job
  await exportQueue.add('generate-export', {
    userId,
    formats: ['json', 'pdf']
  });
  
  return Response.json({ 
    message: 'Export request received. You will receive an email when ready.' 
  });
}
```

---

### FR-PRIVACY-003: Right to Deletion
**Priority:** P0 (Critical - DPDP Compliance)  
**User Story:** As a parent/student, I can delete my account and all associated data.

**Functional Requirements:**
- One-click account deletion
- 30-day grace period (soft delete)
- After grace period, all data is permanently deleted
- Confirmation email sent

**Technical Requirements:**
- Soft delete: Set deletedAt timestamp
- Scheduled job (nightly) permanently deletes after 30 days
- Cascade deletion across related tables
- Anonymize data in audit logs (retain events, remove PII)

**Acceptance Criteria:**
- ✅ Delete button requires confirmation
- ✅ Account is soft-deleted immediately
- ✅ Data is inaccessible during grace period
- ✅ Permanent deletion after 30 days
- ✅ Audit logs are anonymized

---

### FR-PRIVACY-004: Audit Logging
**Priority:** P0 (Critical - DPDP Compliance)  
**User Story:** As a compliance officer, I need complete audit trails of all data access and modifications.

**Functional Requirements:**
- Log all data access (create, read, update, delete)
- Log includes: who, what, when, IP, user agent
- Logs retained for 3 years
- Searchable and exportable

**Technical Requirements:**
- AuditLog table with comprehensive fields
- Middleware logs all API calls
- No PII in logs (use user IDs, not names)
- Elasticsearch or PostgreSQL full-text search

**Acceptance Criteria:**
- ✅ All sensitive operations are logged
- ✅ Logs include sufficient context
- ✅ Logs are tamper-proof
- ✅ Compliance reports can be generated
- ✅ Logs retained for 3 years

**Implementation Notes:**
```typescript
// lib/middleware/audit.ts
export async function auditMiddleware(req: NextRequest) {
  const session = await getSession();
  const startTime = Date.now();
  
  const response = await NextResponse.next();
  
  await db.auditLog.create({
    data: {
      tenantId: session?.user?.tenantId,
      userId: session?.user?.id,
      action: getActionFromMethod(req.method),
      resourceType: getResourceFromPath(req.nextUrl.pathname),
      resourceId: extractResourceId(req.nextUrl.pathname),
      ipAddress: req.ip || req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent'),
      success: response.status < 400,
      metadata: {
        method: req.method,
        path: req.nextUrl.pathname,
        responseTime: Date.now() -