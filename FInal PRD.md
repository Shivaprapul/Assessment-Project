# Student Assessment & Career Support Platform
## MVP Product Requirements Document (PRD)

**Version:** 1.1  
**Last Updated:** January 2026  
**Audience:** Engineering teams, AI engineers, product designers, and AI coding agents (Cursor)

**Goal:** This PRD is intentionally explicit and implementation-oriented so that an AI coding agent can directly scaffold and build the MVP with complete functional requirements.

---

## 1. Business Model & Distribution

### 1.1 Dual-Channel Distribution
- **B2B (Primary):** School-based multi-tenancy SaaS model
- **B2C (Secondary):** Direct student/parent subscriptions

### 1.2 B2B Multi-Tenancy Architecture

**Core Principles:**
- Each school operates as a completely isolated tenant
- **Data segregation is non-negotiable** - zero cross-tenant data access
- Unique branded portal per school (custom subdomain capability)
- Per-tenant feature flags for custom feature deployment
- Tenant-specific configurations, branding, and customizations

**Tenant Isolation Requirements:**
```
- Database: Row-level security with tenant_id on all tables
- Schema: Separate schemas per tenant OR shared schema with strict tenant_id filtering
- Storage: Tenant-specific file storage buckets/directories
- Cache: Tenant-scoped cache keys
- API: Middleware enforces tenant context on every request
```

**Custom Feature Deployment:**
- Feature flag system (e.g., LaunchDarkly pattern or custom)
- Ability to enable/disable features per tenant
- Support for tenant-specific feature development
- A/B testing capability per tenant

### 1.3 Scalability Requirements

**Initial Scale (MVP Launch):**
- 10-15 school tenants
- ~500 students per school
- Total: 5,000-7,500 concurrent users
- Peak load: 2,000-3,000 simultaneous game sessions

**Future Scale (12-24 months):**
- 100+ school tenants
- Up to 1,500 students per school
- Total: 150,000+ users
- Peak load: 30,000+ simultaneous sessions

**Technical Implications:**
- Horizontal scaling for web servers (containerized deployment)
- Database read replicas and connection pooling
- CDN for static assets and game resources
- Async job processing for AI report generation
- Caching strategy (Redis) for frequently accessed data
- Auto-scaling policies based on load metrics

---

## 2. Data Security & Privacy Compliance

### 2.1 Regulatory Compliance

**Primary Legislation:**
- **Digital Personal Data Protection Act (DPDP), 2023**
- **DPDP Rules, 2025**
- Information Technology Act, 2000 (IT Act)

### 2.2 DPDP Act 2023 Compliance Requirements

**Data Principal Rights (Students/Parents):**
1. Right to access their personal data
2. Right to correction and erasure
3. Right to data portability
4. Right to grievance redressal
5. Right to nominate (for minors - parent/guardian)

**Consent Requirements:**
- **Verifiable parental consent** for users under 18
- Clear, specific, informed, and unambiguous consent
- Easy consent withdrawal mechanism
- Consent recorded with timestamp and IP address
- Purpose-specific consent (assessment, reports, analytics)

**Data Fiduciary Obligations:**
- Implement reasonable security safeguards
- Data breach notification within 72 hours
- Appoint Data Protection Officer (DPO)
- Maintain data processing records
- Purpose limitation - use data only for stated purpose
- Data minimization - collect only necessary data
- Storage limitation - retain data only as long as needed

**Children's Data Protection (Critical):**
- **No behavioral monitoring** for advertising/profiling
- **No tracking across websites/apps**
- Age-appropriate privacy notices
- Enhanced security measures for children's data
- Parent dashboard with full visibility and control

### 2.3 Technical Security Implementation

**Authentication & Authorization:**
```
- Email + OTP for students (no password complexity for UX)
- Parent authentication linked to student accounts
- Role-Based Access Control (RBAC): Student, Parent, Teacher, School Admin, Platform Admin
- Session management with secure tokens (JWT with short expiry)
- Multi-factor authentication for admin accounts
```

**Data Encryption:**
```
- TLS 1.3 for data in transit
- AES-256 encryption for data at rest
- Encrypted database backups
- Encrypted file storage (S3/equivalent with server-side encryption)
- PII fields encrypted at column level (optional, recommended)
```

**Database Security:**
```
- Tenant isolation via tenant_id with row-level security policies
- Prepared statements (prevent SQL injection)
- Principle of least privilege for database users
- Regular security audits and penetration testing
- Automated backup with 30-day retention
- Point-in-time recovery capability
```

**API Security:**
```
- Rate limiting per tenant and per user
- Input validation and sanitization
- CORS policies
- API authentication via bearer tokens
- Request/response logging (excluding PII)
```

**Audit & Monitoring:**
```
- Comprehensive audit logs (who accessed what, when)
- Real-time security monitoring and alerts
- Regular vulnerability scanning
- Incident response plan documented
- Data breach notification workflow
```

**Privacy by Design:**
```
- Anonymized analytics (aggregate reporting only)
- Pseudonymization where possible
- Data retention policies enforced via automated cleanup jobs
- Export functionality for data portability
- One-click data deletion for users (with grace period)
```

### 2.4 Data Retention Policy

| Data Type | Retention Period | Justification |
|-----------|------------------|---------------|
| Active student assessment data | Duration of enrollment + 1 year | Educational continuity |
| Inactive accounts | 2 years post last login | DPDP compliance |
| Audit logs | 3 years | Legal/compliance requirement |
| Anonymized analytics | Indefinite | No PII, research purposes |
| Deleted account data | 30-day soft delete, then permanent | Recovery window |

---

## 3. Problem Statement

Indian school students (Grades 8–10) lack structured, engaging, and skills-based assessment systems that identify their inherent abilities, learning styles, and career readiness beyond academic marks.

Parents and schools rely on subjective judgment or late-stage stream selection, leading to stress, misalignment, and underutilization of student potential.

**Education systems optimize for academics but underinvest in character, ethics, and decision-making skills.**

---

## 4. Product Vision

Build a web-based assessment and growth platform that:

1. Assesses students holistically using short, gamified activities
2. Generates AI-driven, evidence-based personalized insights
3. Creates a visual Skill Tree for each student
4. Supports career exploration or goal-based skill development
5. Engages students weekly while informing parents and teachers
6. **Holistic skill + character development**
7. **Ethical reasoning through lived scenarios**
8. Operates as a secure, scalable multi-tenant SaaS platform

---

## 5. Core Philosophy

1. **Character precedes competence**
2. **Reflection over ranking**
3. **Values developed through choice**
4. **Privacy and security as foundational rights**

---

## 6. Target Users

### 6.1 B2B Users (School Tenants)

1. **Students (Grades 8, 9, 10)** - Primary end users
2. **Parents/Guardians** - Consent providers and progress monitors
3. **Teachers** - Class-level insights and student support
4. **School Administrators** - School-wide analytics and management
5. **Platform Administrators** - Multi-tenant system management

### 6.2 B2C Users (Direct Subscriptions)

1. **Students** - Self-enrolled or parent-enrolled
2. **Parents** - Account managers and progress monitors

---

## 7. MVP Scope

### 7.1 In Scope

**Phase 1: Core Assessment (Weeks 1-6)**
1. Multi-tenant authentication and authorization system
2. Student onboarding and profile creation (with parental consent)
3. 8 gamified preliminary assessment modules
4. Skill scoring engine and Skill Tree generation
5. AI-generated personalized student report
6. Behavioral Pattern Timeline (private, longitudinal EQ tracking)

**Phase 2: Post-Assessment Pathways (Weeks 7-10)**
7. **Explorer/Odyssey Mode** - Discovery-based learning path
8. **Facilitator Mode** - Goal-driven skill acquisition path
9. Daily activity recommendation engine
10. AI-powered assessment and feedback system

**Phase 3: Multi-User Dashboards (Weeks 11-12)**
11. Parent dashboard (read-only with consent controls)
12. Teacher dashboard (class-level insights)
13. School admin dashboard (tenant management)
14. Platform admin dashboard (multi-tenant operations)

**Phase 4: Compliance & Security (Continuous)**
15. DPDP Act 2023 compliance framework
16. Data security and encryption
17. Audit logging and monitoring
18. Privacy controls and consent management

### 7.2 Out of Scope (Post-MVP)

1. Live mentoring or counseling
2. Paid third-party courses or certifications
3. Advanced predictive analytics and ML models
4. Mobile native apps (web-responsive only for MVP)
5. Integration with school ERP/LMS systems
6. Peer-to-peer social features
7. Gamification rewards/leaderboards (to avoid unhealthy competition)

---

## 8. Assessment Framework (Core of MVP)

Each assessment produces raw signals, which are normalized into skill scores (0–100).

### 8.1 Assessment Categories

1. **A. Cognitive Reasoning & Intelligence**
2. **B. Creativity & Innovation**
3. **C. Language, Communication & Meaning**
4. **D. Memory & Knowledge Processing**
5. **E. Attention, Discipline & Self-Regulation**
6. **F. Planning, Organization & Execution**
7. **G. Social, Emotional & Ethical Intelligence**
8. **H. Metacognition & Growth**
9. **I. Character, Values & Moral Compass**

---

## 9. Gamified Preliminary Assessments (8 Games)

These are completed during onboarding before students enter either Explorer or Facilitator mode.

### Game 1: Pattern Forge
- **Mechanics:** Sequences, analogies, rule discovery
- **Duration:** 8-10 minutes
- **Signals Captured:** Logical reasoning, pattern recognition, learning speed
- **Categories Mapped:** A (Cognitive Reasoning)

### Game 2: Many Ways Builder
- **Mechanics:** Multi-solution constraint-based task (e.g., build a bridge with limited materials)
- **Duration:** 10-12 minutes
- **Signals Captured:** Creativity, divergent thinking, feasibility assessment, risk-taking
- **Categories Mapped:** B (Creativity & Innovation)

### Game 3: Story Lens
- **Mechanics:** Story continuation from image sequences
- **Duration:** 10 minutes
- **Signals Captured:** Narrative clarity, structure, expression, vocabulary
- **Categories Mapped:** C (Language & Communication)

### Game 4: Visual Vault
- **Mechanics:** Visual memory and recall challenges
- **Duration:** 6-8 minutes
- **Signals Captured:** Retention capacity, encoding style, recall accuracy
- **Categories Mapped:** D (Memory & Knowledge Processing)

### Game 5: Focus Sprint
- **Mechanics:** Error hunt + maze navigation under time pressure
- **Duration:** 8 minutes
- **Signals Captured:** Sustained attention, impulse control, error detection
- **Categories Mapped:** E (Attention & Self-Regulation)

### Game 6: Mission Planner
- **Mechanics:** Plan a task → encounter disruption → revise plan
- **Duration:** 10-12 minutes
- **Signals Captured:** Planning quality, adaptability, resource management
- **Categories Mapped:** F (Planning & Execution)

### Game 7: Dilemma Compass
- **Mechanics:** Ethical and social dilemmas with multiple stakeholders
- **Duration:** 12-15 minutes
- **Signals Captured:** Empathy, ethical reasoning, responsibility, perspective-taking
- **Categories Mapped:** G (Social & Emotional Intelligence), I (Character & Values)

### Game 8: Replay & Reflect
- **Mechanics:** Self-review of previous game performances with guided reflection
- **Duration:** 10 minutes
- **Signals Captured:** Growth mindset, reflection depth, self-awareness
- **Categories Mapped:** H (Metacognition & Growth)

**Total Assessment Time:** ~80-90 minutes (can be split across multiple sessions)

---

## 10. Post-Assessment User Pathways

After completing the 8 preliminary assessments, students unlock two parallel pathways. They can switch between modes anytime.

### 10.1 Explorer Mode (Odyssey)

**Purpose:** Discovery-based learning through exploration and experimentation

**Core Mechanics:**
- Students explore new domains through mini-games and activities
- AI suggests areas based on curiosity signals and initial assessment
- No fixed curriculum or progression path
- Focus on breadth of experience and discovery

**Activity Types:**
1. **Discovery Quests:** Short gamified challenges in new skill areas (15-20 min)
2. **What-If Scenarios:** Hypothetical situations to explore different fields
3. **Skill Samplers:** Try-before-you-commit mini-activities
4. **Career Exploration:** Day-in-the-life simulations of various professions

**AI Role in Explorer Mode:**
```
- Analyze exploration patterns (which domains student gravitates toward)
- Suggest related areas based on interests
- Identify emerging strengths from exploration data
- Provide contextual insights: "You seem drawn to creative problem-solving"
- Update Skill Tree with new discoveries
```

**Frequency:** Self-paced, recommended 2-3x per week

**Assessment:**
- Lightweight, non-intrusive tracking of engagement and choices
- AI provides insights and suggestions, NOT scores or rankings
- Focus on "What did you discover?" rather than "How well did you do?"

### 10.2 Facilitator Mode

**Purpose:** Structured skill acquisition through deliberate practice and goal-setting

**Core Mechanics:**
- Student sets specific skill goals (e.g., "Improve logical reasoning")
- AI generates personalized daily practice activities
- Progressive difficulty adaptation based on performance
- Structured feedback and growth tracking

**Activity Types:**
1. **Daily Challenges:** 10-15 minute focused practice in target skill area
2. **Skill Builders:** Multi-day projects building toward a competency
3. **Reflection Checkpoints:** Weekly self-assessment and goal review
4. **Milestone Assessments:** Monthly deeper evaluation of progress

**AI Role in Facilitator Mode:**
```
- Generate personalized daily activities based on skill gaps
- Adapt difficulty in real-time based on performance
- Provide specific, actionable feedback
- Track progress toward student-set goals
- Identify when to introduce new challenges or consolidate learning
- Suggest strategy adjustments: "Try breaking problems into smaller steps"
```

**Frequency:** Daily (weekdays), 10-20 minutes per session

**Assessment:**
- Continuous formative assessment of skill development
- AI provides growth-focused feedback (not comparative rankings)
- Progress visualized in Skill Tree and Behavioral Timeline
- Emphasis on effort, strategy, and improvement over raw performance

### 10.3 Mode Switching

- Students can switch between modes at any time
- Insights and data flow between both modes
- Skill Tree and Behavioral Timeline unified across both pathways
- Parents/teachers see holistic view regardless of mode preferences

---

## 11. Skill Tree Generation

Each category maps to a **Skill Node**. Scores are bucketed into levels:

1. **0–39:** Emerging (🌱)
2. **40–59:** Developing (🌿)
3. **60–79:** Proficient (🌳)
4. **80–100:** Advanced (🏆)

**Visual Requirements:**
- Interactive, clickable tree visualization
- Color-coded nodes by category
- Animated transitions when levels change
- Tooltip on hover: score, evidence, next steps
- Locked nodes for future skills (post-MVP)
- Growth animations when leveling up

**Technical Implementation:**
```javascript
// Example data structure
{
  studentId: "uuid",
  tenantId: "school_123",
  skillTree: {
    cognitiveReasoning: {
      score: 72,
      level: "Proficient",
      evidence: ["Pattern Forge: 85%", "Explorer: Logic Quest completed"],
      lastUpdated: "2026-01-15",
      trend: "improving" // stable, improving, needs_attention
    },
    creativity: { ... },
    // ... other categories
  }
}
```

---

## 12. Behavioral Pattern Timeline (EQ Tracking)

A **private, longitudinal timeline** of how a student behaves in situations over time.

### 12.1 Purpose
- Track emotional and behavioral patterns across assessments and activities
- Show growth in character and values development
- Provide evidence-based insights into decision-making evolution
- Identify consistent strengths and areas for development

### 12.2 Structure

**Timeline Visualization:**
```
[Month 1] ──●── [Month 2] ──●── [Month 3] ──●──> [Present]
           Event   Event   Event   Event
```

**Event Types Tracked:**
1. **Ethical Decision Moments** (from Dilemma Compass)
2. **Reflection Quality** (from Replay & Reflect)
3. **Adaptability Instances** (from Mission Planner)
4. **Risk-Taking vs. Caution Balance** (from Many Ways Builder)
5. **Empathy Signals** (across all social scenarios)
6. **Persistence vs. Giving Up** (from challenging activities)

**Pattern Identification:**
- Recurring behavioral themes across similar scenarios
- Consistency in value-based decisions
- Evolution in emotional regulation
- Growth in self-awareness

**Privacy:**
- Only visible to the student and authorized parent/guardian
- NOT shared with teachers or school admins without explicit consent
- Encrypted and stored separately from academic data

### 12.3 Data Points Captured

```javascript
{
  eventId: "uuid",
  studentId: "uuid",
  timestamp: "2026-01-15T14:30:00Z",
  eventType: "ethical_decision",
  context: "Dilemma Compass - Resource Allocation Scenario",
  studentChoice: "Prioritized fairness over efficiency",
  aiAnalysis: {
    valuesReflected: ["equity", "empathy"],
    behavioralPattern: "consistent_fairness_orientation",
    growthIndicator: "increased_consideration_of_stakeholders"
  },
  private: true
}
```

---

## 13. AI System Design (Critical)

### 13.1 Inputs

**Game Telemetry:**
- Raw scores, completion time, attempts, errors
- Decision sequences, choice patterns
- Time spent per question/task
- Revisions and self-corrections
- Help requests and hints used

**Behavioral Signals:**
- Reflection text (from Game 8 and checkpoints)
- Ethical choices (from Game 7 and scenarios)
- Persistence metrics (retry patterns)
- Exploration vs. exploitation balance
- Response to difficulty (frustration tolerance)

**Contextual Data:**
- Student goals and preferences
- Previous assessment history
- Mode choice (Explorer vs. Facilitator)
- Session frequency and engagement

### 13.2 Processing

**Pipeline:**
```
1. Data Collection → Raw game telemetry + behavioral logs
2. Normalization → Rule-based scoring (0-100 per category)
3. AI Summarization → LLM analyzes patterns and generates insights
4. Evidence Mapping → Link observations to traits and behaviors
5. Recommendation Generation → Personalized next steps
6. Report Synthesis → Student-friendly language + parent guidance
```

**AI Capabilities:**
- **Rule-based normalization** for objective metrics (speed, accuracy)
- **LLM-powered analysis** for subjective signals (reflection quality, ethical reasoning)
- **Evidence → Trait → Recommendation mapping**
- **AI maps evidence to values, behaviors, and growth guidance**
- Pattern recognition across longitudinal data
- Adaptive difficulty and content selection

**AI Models:**
- Primary LLM: GPT-4 or Claude 3.5 Sonnet (via API)
- Structured prompts with few-shot examples
- Temperature: 0.3-0.5 for consistency
- Max tokens: 1500 per report section

**Example Prompt Structure:**
```
You are an educational psychologist analyzing a student's performance.

Student Profile:
- Age: 14, Grade 9
- Goal: Explore creative fields
- Assessment Scores: [JSON data]

Task: Analyze the student's performance in "Many Ways Builder" game.

Evidence:
- Attempted 7 different solutions (high divergence)
- 3 solutions were feasible, 2 were creative but impractical
- Spent 80% of time ideating, 20% testing
- Reflection: "I wanted to try everything possible"

Generate:
1. Key strengths (2-3 sentences)
2. Growth areas (2-3 sentences)
3. Actionable recommendations (2-3 specific suggestions)
4. Parent guidance (how to support at home)

Use encouraging, growth-oriented language. Avoid labels or deterministic statements.
```

### 13.3 Outputs

**For Students:**
1. **Personalized Insight Report**
   - Strengths highlighted with specific evidence
   - Growth areas framed positively
   - Next recommended activities
   - Celebration of progress and effort

**For Parents:**
2. **Parent Guidance Summary**
   - High-level overview of child's profile
   - Key strengths to nurture
   - Areas to support (with "how to help" tips)
   - Red flags or concerns (if any, phrased sensitively)

**For Teachers (B2B only):**
3. **Class-Level Insights**
   - Aggregate patterns (no individual PII)
   - Common strengths and challenges
   - Suggested classroom activities

**Ongoing Outputs:**
4. **Behavioral Pattern Insights** (for Timeline)
5. **Daily Activity Recommendations** (for Facilitator Mode)
6. **Exploration Suggestions** (for Explorer Mode)

### 13.4 AI Safety & Ethics

- **No medical or psychiatric diagnoses** (e.g., "shows signs of ADHD")
- **No career determinism** (e.g., "should become an engineer")
- **Growth-oriented language** (e.g., "developing" not "weak")
- **Cultural sensitivity** (Indian context, avoid Western biases)
- **Transparency:** Parents can see what data informs AI conclusions
- **Human oversight:** Flagged reports reviewed by educators before delivery

---

## 14. Core User Flows

### 14.1 Student Flow (B2B)

**Onboarding:**
```
1. School admin creates student account
2. Student receives login credentials (email/student ID + OTP)
3. Parent provides verifiable consent via unique link
4. Student creates avatar and sets initial goals
5. Privacy notice and consent confirmation
```

**Initial Assessment:**
```
6. Introduction to 8 games (video tutorial)
7. Complete Game 1: Pattern Forge
8. ... Games 2-7 (can pause and resume)
9. Complete Game 8: Replay & Reflect
10. AI processes data (background job)
```

**Pathway Selection:**
```
11. View preliminary Skill Tree
12. Receive AI-generated report
13. Choose initial mode: Explorer or Facilitator
14. Set personal goals (optional)
```

**Ongoing Engagement (Explorer Mode):**
```
15. Dashboard shows suggested discoveries
16. Select and play discovery quest
17. AI provides insights and follow-up suggestions
18. Skill Tree and Timeline update automatically
```

**Ongoing Engagement (Facilitator Mode):**
```
15. Dashboard shows daily challenge
16. Complete challenge (10-15 min)
17. Receive AI feedback
18. Track progress toward goals
19. Weekly reflection checkpoint
```

### 14.2 Parent Flow (B2B & B2C)

```
1. Receive email invite to link to child's account
2. Create parent account (email + OTP)
3. Provide verifiable consent for child's participation
4. Set consent preferences (data sharing, visibility)
5. Access parent dashboard
6. View child's Skill Tree (summary view)
7. Read AI-generated parent guidance
8. Opt-in to view Behavioral Timeline (child can revoke)
9. Set preferences for notifications
10. Download/export child's data (DPDP compliance)
```

### 14.3 Teacher Flow (B2B Only)

```
1. School admin grants teacher access to class
2. Teacher logs in via school portal
3. View class roster (students in their sections)
4. Access class-level analytics (aggregate only)
5. View individual student reports (if school policy allows)
6. Download class insights for lesson planning
7. Mark students for additional support (flags go to admin)
```

### 14.4 School Admin Flow (B2B)

```
1. Platform admin creates school tenant
2. School admin receives onboarding email
3. Set up school profile (name, logo, subdomain)
4. Bulk upload student roster (CSV import)
5. Invite teachers and assign classes
6. Configure school-level settings (features, permissions)
7. View school-wide dashboard (aggregate analytics)
8. Generate compliance reports (data access logs)
9. Manage parent consent records
10. Export all school data (DPDP compliance)
```

### 14.5 Platform Admin Flow (Internal)

```
1. Multi-tenant operations dashboard
2. Create/suspend/delete school tenants
3. Configure per-tenant feature flags
4. Monitor system health and scaling metrics
5. Review security audit logs
6. Manage data retention and cleanup jobs
7. Handle data breach incidents (if any)
8. Generate compliance reports (DPDP)
```

---

## 15. UI Screens (MVP Mandatory)

### 15.1 Public/Marketing

1. **Landing Page**
   - Student-first messaging
   - B2B (schools) and B2C (parents) CTAs
   - Trust signals (DPDP compliance, security)
   - Demo video

### 15.2 Authentication

2. **Login/Signup**
   - Email + OTP (student-safe, no password)
   - Role selection: Student / Parent / Teacher / Admin
   - Tenant selection (for B2B users)

3. **Parental Consent Screen**
   - Clear, age-appropriate language
   - Purpose-specific consent checkboxes
   - Record consent with timestamp

### 15.3 Student Screens

4. **Student Onboarding**
   - Avatar creation
   - Goal selection
   - Privacy notice

5. **Student Dashboard**
   - Skill Tree (central feature)
   - Mode selector (Explorer / Facilitator)
   - Daily activity card
   - Progress stats

6. **Game Engine Screens** (8 games)
   - Unified game wrapper with consistent UI
   - Instructions, play area, timer
   - Pause/resume functionality
   - Progress indicator

7. **AI Report Screen**
   - Personalized insights
   - Evidence-based observations
   - Recommendations
   - Shareable with parents (toggle)

8. **Behavioral Pattern Timeline Screen**
   - Visual timeline with events
   - Clickable events for details
   - Privacy controls (who can see)
   - Growth highlights

9. **Explorer Mode Dashboard**
   - Discovery quests grid
   - "You might like..." suggestions
   - Exploration history

10. **Facilitator Mode Dashboard**
    - Daily challenge card
    - Goal tracker
    - Progress charts
    - Reflection journal

### 15.4 Parent Screens

11. **Parent Dashboard**
    - Child's Skill Tree (summary)
    - AI parent guidance
    - Activity history
    - Consent management
    - Data export/delete

### 15.5 Teacher Screens (B2B)

12. **Teacher Dashboard**
    - Class roster
    - Aggregate class insights
    - Individual student reports (if allowed)
    - Recommended classroom activities

### 15.6 School Admin Screens (B2B)

13. **School Admin Dashboard**
    - School-wide analytics
    - Student/teacher management
    - Consent tracking
    - Compliance reports
    - Bulk operations (CSV import/export)

### 15.7 Platform Admin Screens (Internal)

14. **Platform Admin Dashboard**
    - Tenant management
    - Feature flag configuration
    - System monitoring
    - Security audit logs
    - Data retention management

---

## 16. Tech Stack (Cursor-Friendly)

### 16.1 Frontend

**Framework:** Next.js 14+ (App Router)
- TypeScript for type safety
- React Server Components where appropriate
- Client components for interactivity

**Styling:** Tailwind CSS
- shadcn/ui component library (accessible, customizable)
- Framer Motion for animations (Skill Tree, transitions)

**State Management:**
- React Context for global state (user, tenant)
- TanStack Query (React Query) for server state
- Zustand for client state (game progress, UI preferences)

**Game Engine:**
- HTML5 Canvas or SVG for visuals
- React-based game components
- Configurable JSON-driven game definitions

**Charts/Visualizations:**
- Recharts or D3.js for Skill Tree and analytics
- Custom timeline component for Behavioral Pattern Timeline

### 16.2 Backend

**Framework:** Node.js with Next.js API Routes OR FastAPI (Python)
- Recommendation: Next.js API routes for simpler deployment
- Alternative: FastAPI if heavy Python ML/AI libraries needed

**API Design:**
- RESTful for CRUD operations
- GraphQL optional (for complex queries)
- WebSocket for real-time game telemetry

**Authentication:**
- NextAuth.js (if Next.js) or custom JWT implementation
- Email + OTP via Twilio/SendGrid
- Role-based access control (RBAC) middleware

**Multi-Tenancy Middleware:**
```javascript
// Pseudo-code for tenant isolation
async function tenantMiddleware(req, res, next) {
  const tenantId = req.headers['x-tenant-id'] || req.user.tenantId;
  if (!tenantId) return res.status(403).json({ error: 'Tenant required' });
  req.tenant = await getTenant(tenantId);
  req.dbConnection = getTenantDbConnection(tenantId); // if separate schemas
  next();
}
```

### 16.3 Database

**Primary Database:** PostgreSQL 15+
- Row-level security (RLS) for tenant isolation
- JSONB columns for flexible game telemetry
- Full-text search for content discovery

**Schema Strategy (Choose one):**

**Option A: Shared Schema with tenant_id**
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  grade INT CHECK (grade IN (8, 9, 10)),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE POLICY tenant_isolation ON students
  USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

**Option B: Schema-per-Tenant** (more isolation, harder to manage)
```sql
CREATE SCHEMA tenant_school123;
CREATE TABLE tenant_school123.students (...);
```

**Recommended:** Option A with RLS for MVP (easier, proven pattern)

**Caching:** Redis
- Session storage
- Frequently accessed data (student profiles, Skill Tree)
- Rate limiting counters
- Real-time leaderboards (future)

**File Storage:** AWS S3 or compatible (MinIO for self-hosted)
- Student avatars
- Uploaded consent forms (encrypted)
- Generated reports (PDFs)
- Game assets (images, audio)

### 16.4 AI/ML

**LLM Provider:** OpenAI GPT-4 or Anthropic Claude 3.5 Sonnet
- Structured prompts for report generation
- JSON mode for parseable outputs
- Function calling for dynamic recommendations

**AI Architecture:**
```
Game Telemetry → Queue (Bull/BullMQ) → AI Worker
                                          ↓
                               Prompt Engineering Layer
                                          ↓
                                  LLM API (OpenAI/Anthropic)
                                          ↓
                               Response Parser & Validator
                                          ↓
                              Store in DB (ai_reports table)
```

**Async Processing:**
- Background jobs for AI report generation (can take 10-30 seconds)
- Job queue: BullMQ (Redis-backed)
- Workers: Separate Node.js processes or serverless functions

### 16.5 Infrastructure

**Hosting:** Vercel (Next.js) or AWS/GCP
- Vercel: Easiest for Next.js, built-in CDN
- AWS: More control, better for scaling

**Containerization:** Docker
- Multi-stage builds for optimization
- Docker Compose for local development

**CI/CD:**
- GitHub Actions or GitLab CI
- Automated testing on PR
- Staging environment per tenant (optional)
- Production deployment with rollback capability

**Monitoring & Logging:**
- Application monitoring: Sentry (error tracking)
- Performance monitoring: Vercel Analytics or New Relic
- Logging: Structured logs (JSON) with Winston/Pino
- Log aggregation: CloudWatch or Datadog

**Scalability:**
- Horizontal scaling: Kubernetes or AWS ECS (post-MVP)
- Database: Read replicas, connection pooling (PgBouncer)
- CDN: Cloudflare or AWS CloudFront
- Auto-scaling policies based on CPU/memory/request rate

---

## 17. Core Data Models

### 17.1 Multi-Tenancy Core

```typescript
// Tenant (School or B2C Organization)
interface Tenant {
  id: string; // UUID
  name: string; // "ABC International School"
  type: 'school' | 'b2c';
  subdomain: string; // "abc-school" → abc-school.platform.com
  customDomain?: string; // Optional: school.edu.in
  branding: {
    logo: string; // URL to logo
    primaryColor: string;
    secondaryColor: string;
  };
  features: {
    explorerMode: boolean;
    facilitatorMode: boolean;
    behavioralTimeline: boolean;
    customFeature1?: boolean; // Tenant-specific feature flags
  };
  subscription: {
    plan: 'trial' | 'basic' | 'premium';
    startDate: Date;
    endDate: Date;
    maxStudents: number;
  };
  dataRetentionDays: number; // DPDP compliance
  createdAt: Date;
  updatedAt: Date;
}

// User (polymorphic: student, parent, teacher, admin)
interface User {
  id: string;
  tenantId: string; // Foreign key to Tenant
  email: string; // Unique within tenant
  role: 'student' | 'parent' | 'teacher' | 'school_admin' | 'platform_admin';
  name: string;
  phone?: string;
  avatar?: string;
  metadata: Record<string, any>; // Flexible for role-specific data
  consentRecords: ConsentRecord[];
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}
```

### 17.2 Student-Specific Models

```typescript
// Student Profile
interface StudentProfile {
  id: string;
  userId: string; // Foreign key to User
  tenantId: string;
  grade: 8 | 9 | 10;
  section?: string; // Class section
  dateOfBirth: Date;
  parentIds: string[]; // Foreign keys to parent User IDs
  teacherIds: string[]; // Assigned teachers
  goals: string[]; // Student-set goals
  preferredMode: 'explorer' | 'facilitator' | null;
  onboardingComplete: boolean;
  assessmentComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Assessment Attempt
interface AssessmentAttempt {
  id: string;
  studentId: string;
  tenantId: string;
  gameId: string; // "pattern_forge", "many_ways_builder", etc.
  attemptNumber: number; // 1, 2, 3... (if retaken)
  startedAt: Date;
  completedAt?: Date;
  status: 'in_progress' | 'completed' | 'abandoned';
  telemetry: {
    timeSpent: number; // seconds
    actions: any[]; // Game-specific action log
    errors: number;
    hintsUsed: number;
    revisions: number;
  };
  rawScores: Record<string, number>; // Game-specific metrics
  normalizedScores: Record<string, number>; // Category scores (0-100)
  reflectionText?: string; // From Game 8
  metadata: Record<string, any>;
}

// Skill Score (aggregated from assessments)
interface SkillScore {
  id: string;
  studentId: string;
  tenantId: string;
  category: 'cognitive_reasoning' | 'creativity' | 'language' | 'memory' | 
            'attention' | 'planning' | 'social_emotional' | 'metacognition' | 
            'character_values';
  score: number; // 0-100
  level: 'emerging' | 'developing' | 'proficient' | 'advanced';
  evidence: string[]; // Supporting data points
  trend: 'improving' | 'stable' | 'needs_attention';
  lastUpdatedAt: Date;
  history: {
    date: Date;
    score: number;
  }[];
}

// AI Report
interface AIReport {
  id: string;
  studentId: string;
  tenantId: string;
  reportType: 'initial_assessment' | 'monthly_progress' | 'goal_review';
  generatedAt: Date;
  studentInsights: {
    strengths: string; // AI-generated text
    growthAreas: string;
    recommendations: string[];
    celebratoryMessage: string;
  };
  parentGuidance: {
    overview: string;
    supportTips: string[];
    redFlags?: string[];
  };
  evidenceUsed: string[]; // IDs of AssessmentAttempts
  metadata: {
    llmModel: string; // "gpt-4-turbo"
    promptVersion: string;
    generationTime: number; // milliseconds
  };
}
```

### 17.3 Behavioral Timeline Models

```typescript
// Behavioral Event
interface BehavioralEvent {
  id: string;
  studentId: string;
  tenantId: string;
  timestamp: Date;
  eventType: 'ethical_decision' | 'reflection' | 'adaptability' | 
              'risk_taking' | 'empathy' | 'persistence';
  context: string; // "Dilemma Compass - Resource Allocation"
  sourceGameId?: string; // Optional link to game
  studentChoice: string; // Description of what student did
  aiAnalysis: {
    valuesReflected: string[]; // ["equity", "empathy"]
    behavioralPattern: string; // "consistent_fairness_orientation"
    growthIndicator: string; // "increased_stakeholder_consideration"
  };
  visibility: 'student_only' | 'student_and_parent' | 'all';
  metadata: Record<string, any>;
}
```

### 17.4 Activity Models (Explorer & Facilitator)

```typescript
// Activity Definition (for both modes)
interface Activity {
  id: string;
  tenantId?: string; // Null for global, specific for custom
  title: string;
  description: string;
  mode: 'explorer' | 'facilitator' | 'both';
  type: 'discovery_quest' | 'daily_challenge' | 'skill_builder' | 
        'reflection' | 'milestone';
  targetCategories: string[]; // Which skills it addresses
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedTime: number; // minutes
  content: Record<string, any>; // Activity-specific content
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Activity Attempt (student's engagement)
interface ActivityAttempt {
  id: string;
  studentId: string;
  tenantId: string;
  activityId: string;
  mode: 'explorer' | 'facilitator';
  startedAt: Date;
  completedAt?: Date;
  status: 'in_progress' | 'completed' | 'skipped';
  telemetry: Record<string, any>; // Activity-specific data
  aiAssessment?: {
    feedback: string;
    skillImpact: Record<string, number>; // Category → score delta
    nextSteps: string[];
  };
  reflectionText?: string;
}
```

### 17.5 Consent & Compliance Models

```typescript
// Consent Record
interface ConsentRecord {
  id: string;
  userId: string; // The user giving consent (parent for minor)
  subjectUserId: string; // The subject (student if minor)
  tenantId: string;
  purpose: 'assessment' | 'data_processing' | 'ai_analysis' | 
           'parent_visibility' | 'teacher_visibility' | 'research';
  granted: boolean;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  expiresAt?: Date; // For time-bound consent
  withdrawnAt?: Date;
  metadata: Record<string, any>;
}

// Audit Log
interface AuditLog {
  id: string;
  tenantId: string;
  userId: string; // Who performed the action
  action: 'create' | 'read' | 'update' | 'delete' | 'export';
  resourceType: 'student' | 'assessment' | 'report' | 'consent' | 'activity';
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
  metadata: Record<string, any>;
}
```

---

## 18. API Endpoints (Key Routes)

### 18.1 Authentication

```
POST   /api/auth/send-otp
POST   /api/auth/verify-otp
POST   /api/auth/logout
GET    /api/auth/session
```

### 18.2 Student

```
GET    /api/students/me                    # Get current student profile
PUT    /api/students/me                    # Update profile
GET    /api/students/me/skill-tree         # Get Skill Tree
GET    /api/students/me/timeline           # Get Behavioral Timeline
GET    /api/students/me/reports            # Get all AI reports
GET    /api/students/me/activities         # Get recommended activities
```

### 18.3 Assessments

```
GET    /api/assessments                    # List available games
POST   /api/assessments/:gameId/start      # Start a game
PUT    /api/assessments/:attemptId/update  # Save progress
POST   /api/assessments/:attemptId/submit  # Submit completed game
```

### 18.4 Activities (Explorer & Facilitator)

```
GET    /api/activities/explorer            # Get Explorer activities
GET    /api/activities/facilitator/daily   # Get today's challenge
POST   /api/activities/:activityId/start   # Start an activity
PUT    /api/activities/:attemptId/submit   # Submit activity
```

### 18.5 Parent

```
GET    /api/parents/children               # List linked children
GET    /api/parents/children/:id/overview  # Child's summary
GET    /api/parents/children/:id/reports   # Child's reports
POST   /api/parents/consent                # Grant/update consent
```

### 18.6 Teacher (B2B)

```
GET    /api/teachers/classes               # Assigned classes
GET    /api/teachers/classes/:id/students  # Student roster
GET    /api/teachers/classes/:id/insights  # Class analytics
GET    /api/teachers/students/:id/report   # Individual report
```

### 18.7 School Admin (B2B)

```
GET    /api/admin/school/stats             # School-wide stats
POST   /api/admin/students/bulk-import     # CSV upload
GET    /api/admin/compliance/consents      # Consent tracking
GET    /api/admin/compliance/audit-logs    # Activity logs
POST   /api/admin/data/export              # DPDP data export
```

### 18.8 Platform Admin (Internal)

```
GET    /api/platform/tenants               # List all tenants
POST   /api/platform/tenants               # Create tenant
PUT    /api/platform/tenants/:id/features  # Toggle features
GET    /api/platform/system/health         # System monitoring
```

---

## 19. MVP Success Metrics

### 19.1 Engagement Metrics

1. **Assessment completion rate > 85%**
   - % of students who complete all 8 preliminary games
   
2. **Avg time per game session < 15 minutes**
   - Ensures games are concise and engaging
   
3. **Mode adoption rate**
   - % choosing Explorer vs. Facilitator
   - Target: 40% Explorer, 60% Facilitator (hypothesis)

4. **Weekly active users (WAU) > 70%**
   - % of enrolled students active at least once per week

### 19.2 Quality Metrics

5. **Parent report open rate > 60%**
   - % of parents who view their child's AI report within 7 days

6. **Reflection quality score > 3.5/5**
   - AI-assessed depth of student reflections (Game 8, checkpoints)

7. **AI report generation time < 30 seconds**
   - Technical performance metric

### 19.3 Business Metrics (B2B)

8. **School retention rate > 90%** (post-trial)
   - % of schools converting from trial to paid

9. **Student capacity utilization > 75%**
   - % of school's purchased licenses actively used

10. **Feature adoption (custom features) > 50%**
    - % of schools using at least one tenant-specific feature

### 19.4 Compliance Metrics

11. **Consent completion rate = 100%**
    - All active students must have valid parental consent

12. **Data export request fulfillment < 48 hours**
    - DPDP compliance: respond to data requests within 2 days

13. **Zero data breaches**
    - Critical security metric

---

## 20. Risks & Guardrails

### 20.1 Educational Risks

1. **Career Determinism**
   - ❌ Avoid: "You should become a doctor"
   - ✅ Instead: "You show interest in problem-solving and helping others"

2. **Medical/Psychiatric Labeling**
   - ❌ Avoid: "Shows signs of ADHD" or "Likely dyslexic"
   - ✅ Instead: "Works better with shorter tasks" + "Consider consulting with educators"

3. **Fixed Mindset Language**
   - ❌ Avoid: "Weak in math" or "Not creative"
   - ✅ Instead: "Developing logical reasoning" or "Exploring creative approaches"

4. **Comparative Ranking**
   - ❌ Avoid: "Top 10% of students" or "Below average"
   - ✅ Instead: Individual growth tracking only

### 20.2 Cultural & Linguistic Risks

5. **Western Bias in Assessments**
   - Ensure scenarios reflect Indian cultural context
   - Use Indian names, settings, examples in games

6. **Language Clarity**
   - Simple English for Grades 8-10
   - Avoid idiomatic expressions
   - Glossary for complex terms

7. **Socioeconomic Assumptions**
   - Don't assume access to technology/resources
   - Avoid scenarios requiring specific family structures

### 20.3 Privacy & Security Risks

8. **Data Breach**
   - Mitigation: Encryption, audit logs, incident response plan
   - Regular penetration testing (quarterly post-MVP)

9. **Cross-Tenant Data Leakage**
   - Mitigation: Strict tenant isolation, automated tests
   - Row-level security policies enforced

10. **Consent Ambiguity**
    - Mitigation: Clear, simple consent language
    - Explicit opt-in for each data use purpose

11. **Third-Party AI Risk**
    - Mitigation: Don't send PII to LLM (anonymize)
    - Use dedicated API keys, monitor usage

### 20.4 Technical Risks

12. **Scalability Bottlenecks**
    - Mitigation: Load testing before school launches
    - Auto-scaling configured and tested

13. **AI Report Quality**
    - Mitigation: Human review of first 100 reports
    - A/B test prompts for quality
    - Collect parent/student feedback

14. **Single Point of Failure**
    - Mitigation: Database replication, backup strategies
    - Multi-region deployment (post-MVP)

---

## 21. Compliance Checklist (DPDP Act 2023)

### 21.1 Pre-Launch Requirements

- [ ] Appoint Data Protection Officer (DPO)
- [ ] Draft Privacy Policy (student-friendly language)
- [ ] Create Consent Management System
- [ ] Implement Data Retention Policy (auto-delete after retention period)
- [ ] Set up Audit Logging
- [ ] Encrypt all PII at rest and in transit
- [ ] Create Data Breach Response Plan
- [ ] Train team on DPDP compliance

### 21.2 Ongoing Compliance

- [ ] Monthly consent audit (ensure all active users have valid consent)
- [ ] Quarterly security review
- [ ] Annual DPDP compliance assessment
- [ ] Prompt response to data subject requests (< 48 hours)
- [ ] Regular backup testing (monthly)
- [ ] Incident log maintenance

### 21.3 User-Facing Features

- [ ] Easy consent withdrawal mechanism
- [ ] One-click data export (JSON/PDF)
- [ ] One-click account deletion (with 30-day grace period)
- [ ] Transparent data usage explanations
- [ ] Parent dashboard with consent controls
- [ ] Grievance redressal contact (email/phone)

---

## 22. Development Roadmap (12-Week MVP)

### Phase 1: Foundation (Weeks 1-3)

**Week 1: Setup & Core Infrastructure**
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up PostgreSQL with multi-tenancy schema
- [ ] Implement authentication (email + OTP)
- [ ] Create tenant middleware and isolation tests
- [ ] Set up Redis for caching and sessions
- [ ] Deploy to staging environment

**Week 2: User Management**
- [ ] User CRUD (students, parents, teachers, admins)
- [ ] Role-based access control (RBAC)
- [ ] Tenant management (create, update, configure)
- [ ] Consent management system
- [ ] Audit logging infrastructure

**Week 3: Onboarding Flows**
- [ ] Student onboarding UI (avatar, goals)
- [ ] Parent consent flow
- [ ] School admin bulk student import
- [ ] Privacy policy and consent screens

### Phase 2: Assessment Engine (Weeks 4-6)

**Week 4: Game Engine Core**
- [ ] Generic game engine framework (reusable components)
- [ ] Game state management (save/resume)
- [ ] Telemetry capture system
- [ ] Timer and progress tracking

**Week 5: Games 1-4**
- [ ] Game 1: Pattern Forge (logic puzzles)
- [ ] Game 2: Many Ways Builder (creative challenge)
- [ ] Game 3: Story Lens (narrative writing)
- [ ] Game 4: Visual Vault (memory game)
- [ ] Scoring and normalization for each

**Week 6: Games 5-8**
- [ ] Game 5: Focus Sprint (attention test)
- [ ] Game 6: Mission Planner (planning simulation)
- [ ] Game 7: Dilemma Compass (ethical scenarios)
- [ ] Game 8: Replay & Reflect (metacognitive reflection)
- [ ] End-to-end assessment flow testing

### Phase 3: AI & Insights (Weeks 7-8)

**Week 7: AI Integration**
- [ ] Set up LLM API (OpenAI/Anthropic)
- [ ] Design prompt templates for report generation
- [ ] Implement background job queue (BullMQ)
- [ ] AI worker for report generation
- [ ] Evidence → Trait mapping logic

**Week 8: Skill Tree & Timeline**
- [ ] Skill Tree visualization (D3.js/Recharts)
- [ ] Score normalization and bucketing
- [ ] Behavioral Timeline data model
- [ ] Timeline UI (event visualization)
- [ ] AI-generated insights and recommendations

### Phase 4: Post-Assessment Pathways (Weeks 9-10)

**Week 9: Explorer Mode**
- [ ] Activity recommendation engine
- [ ] Discovery quest templates (5-10 activities)
- [ ] Explorer dashboard UI
- [ ] AI-powered exploration insights

**Week 10: Facilitator Mode**
- [ ] Daily challenge generator
- [ ] Goal-setting and tracking UI
- [ ] Skill builder activity flow
- [ ] Progress visualization
- [ ] Weekly reflection checkpoints

### Phase 5: Dashboards & Polish (Weeks 11-12)

**Week 11: Multi-User Dashboards**
- [ ] Parent dashboard (read-only insights)
- [ ] Teacher dashboard (class analytics)
- [ ] School admin dashboard (school-wide stats)
- [ ] Platform admin dashboard (multi-tenant ops)

**Week 12: Testing & Launch Prep**
- [ ] End-to-end testing (all user flows)
- [ ] Load testing (simulate 500 concurrent users per school)
- [ ] Security audit (penetration testing)
- [ ] DPDP compliance review
- [ ] Documentation (user guides, API docs)
- [ ] Soft launch with 1-2 pilot schools

---

## 23. Post-MVP Roadmap (Future Enhancements)

### Phase 6: Advanced Features (Months 4-6)

- [ ] Mobile app (React Native or Progressive Web App)
- [ ] Advanced analytics (predictive models, trend analysis)
- [ ] Integration with school ERP/LMS systems
- [ ] Live mentoring/counseling (video calls)
- [ ] Peer collaboration features (study groups, challenges)
- [ ] Gamification layer (badges, achievements without rankings)
- [ ] Multi-language support (Hindi, regional languages)

### Phase 7: Ecosystem Expansion (Months 7-12)

- [ ] Marketplace for third-party content (activities, assessments)
- [ ] API for external integrations
- [ ] White-label solution for enterprise customers
- [ ] Parent community features (forums, resource sharing)
- [ ] Career counselor portal with student insights
- [ ] Advanced AI features (voice-based assessments, adaptive pathways)

---

## 24. Instructions for AI Coding Agents (Cursor)

### 24.1 Development Approach

**Treat each section as a module. Build incrementally:**

1. **Step 1: Foundation (Week 1-3)**
   - Set up Next.js 14+ with TypeScript, Tailwind CSS, shadcn/ui
   - PostgreSQL with multi-tenancy (shared schema + RLS)
   - NextAuth.js with email/OTP authentication
   - Tenant middleware for all API routes
   - Redis for sessions and caching

2. **Step 2: Game Engine (Week 4-6)**
   - Generic game component architecture
   - JSON-driven game configuration
   - Telemetry capture and storage
   - 8 games with unique mechanics
   - Save/resume functionality

3. **Step 3: AI Integration (Week 7-8)**
   - BullMQ job queue setup
   - OpenAI/Anthropic API integration
   - Prompt engineering for reports
   - Skill Tree scoring logic
   - Behavioral Timeline tracking

4. **Step 4: Pathways (Week 9-10)**
   - Explorer Mode activity engine
   - Facilitator Mode daily challenges
   - AI recommendation systems
   - Progress tracking and visualization

5. **Step 5: Dashboards (Week 11-12)**
   - Multi-role dashboard UIs
   - Parent/Teacher/Admin views
   - Compliance reporting
   - Data export functionality

### 24.2 Code Structure Guidelines

```
/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes
│   ├── (student)/                # Student portal
│   ├── (parent)/                 # Parent portal
│   ├── (teacher)/                # Teacher portal (B2B)
│   ├── (admin)/                  # School admin portal (B2B)
│   ├── (platform)/               # Platform admin (internal)
│   ├── api/                      # API routes
│   └── games/                    # Game screens
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── games/                    # Game-specific components
│   ├── dashboards/               # Dashboard components
│   └── shared/                   # Shared components
├── lib/
│   ├── db/                       # Database client and queries
│   ├── auth/                     # Auth utilities
│   ├── ai/                       # AI/LLM integration
│   ├── tenant/                   # Multi-tenancy utilities
│   └── utils/                    # Helpers
├── prisma/
│   └── schema.prisma             # Database schema
├── workers/
│   └── ai-report-generator.ts   # Background job worker
└── types/
    └── index.ts                  # TypeScript types
```

### 24.3 Key Implementation Principles

1. **Multi-Tenancy First**: Every query/mutation MUST filter by `tenant_id`
2. **Security by Default**: Always validate, sanitize, and authorize
3. **Privacy Compliance**: Log all data access, implement consent checks
4. **Scalability**: Use caching, async jobs, and optimized queries
5. **Type Safety**: Leverage TypeScript for all models and APIs
6. **Testing**: Write tests for critical paths (auth, tenant isolation, AI generation)
7. **Documentation**: Comment complex logic, especially AI prompts and scoring algorithms

### 24.4 Testing Strategy

```typescript
// Example: Tenant isolation test
describe('Tenant Isolation', () => {
  it('should not allow cross-tenant data access', async () => {
    const school1Student = await createStudent({ tenantId: 'school1' });
    const school2Admin = await createAdmin({ tenantId: 'school2' });
    
    const response = await api
      .get(`/api/students/${school1Student.id}`)
      .set('Authorization', school2Admin.token);
    
    expect(response.status).toBe(403);
  });
});
```

### 24.5 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/eduplatform
REDIS_URL=redis://localhost:6379

# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Email (OTP)
SENDGRID_API_KEY=your-sendgrid-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# AI
OPENAI_API_KEY=your-openai-key
# OR
ANTHROPIC_API_KEY=your-anthropic-key

# Storage
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

---

## 25. Glossary

- **Tenant**: A school or organization using the platform as an isolated entity
- **RLS (Row-Level Security)**: PostgreSQL feature for data isolation
- **OTP (One-Time Password)**: Authentication method via email/SMS
- **DPDP**: Digital Personal Data Protection Act, 2023 (India)
- **Skill Tree**: Visual representation of student's skills and growth
- **Behavioral Timeline**: Longitudinal tracking of behavioral patterns
- **Explorer Mode**: Discovery-based learning pathway
- **Facilitator Mode**: Goal-driven skill acquisition pathway
- **Telemetry**: Data captured during game/activity interactions
- **RBAC (Role-Based Access Control)**: Permission system based on user roles

---

## 26. Support & Contact

**For Technical Issues:**
- GitHub Issues: [repository-url]
- Email: engineering@platform.com

**For Compliance Questions:**
- Data Protection Officer: dpo@platform.com
- Legal Team: legal@platform.com

**For Business Inquiries:**
- Sales: sales@platform.com
- Partnerships: partnerships@platform.com

---

**End of MVP PRD**

This document should be updated as requirements evolve. Version control via Git is recommended.
- GitHub Actions or GitLab CI
- Automated testing on PR
- Staging environment per tenant (optional)
- Production deployment with rollback capability

**Monitoring & Logging:**
- Application monitoring: Sentry (error tracking)
- Performance monitoring: Vercel Analytics or New Relic
- Logging: Structured logs (JSON) with Winston/Pino
- Log aggregation: CloudWatch or Datadog

**Scalability:**
- Horizontal scaling: Kubernetes or AWS ECS (post-MVP)
- Database: Read replicas, connection pooling (PgBouncer)
- CDN: Cloudflare or AWS CloudFront
- Auto-scaling policies based on CPU/memory/request rate

---

## 17. Core Data Models

### 17.1 Multi-Tenancy Core

```typescript
// Tenant (School or B2C Organization)
interface Tenant {
  id: string; // UUID
  name: string; // "ABC International School"
  type: 'school' | 'b2c';
  subdomain: string; // "abc-school" → abc-school.platform.com
  customDomain?: string; // Optional: school.edu.in
  branding: {
    logo: string; // URL to logo
    primaryColor: string;
    secondaryColor: string;
  };
  features: {
    explorerMode: boolean;
    facilitatorMode: boolean;
    behavioralTimeline: boolean;
    customFeature1?: boolean; // Tenant-specific feature flags
  };
  subscription: {
    plan: 'trial' | 'basic' | 'premium';
    startDate: Date;
    endDate: Date;
    maxStudents: number;
  };
  dataRetentionDays: number; // DPDP compliance
  createdAt: Date;
  updatedAt: Date;
}

// User (polymorphic: student, parent, teacher, admin)
interface User {
  id: string;
  tenantId: string; // Foreign key to Tenant
  email: string; // Unique within tenant
  role: 'student' | 'parent' | 'teacher' | 'school_admin' | 'platform_admin';
  name: string;
  phone?: string;
  avatar?: string;
  metadata: Record<string, any>; // Flexible for role-specific data
  consentRecords: ConsentRecord[];
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}
```

### 17.2 Student-Specific Models

```typescript
// Student Profile
interface StudentProfile {
  id: string;
  userId: string; // Foreign key to User
  tenantId: string;
  grade: 8 | 9 | 10;
  section?: string; // Class section
  dateOfBirth: Date;
  parentIds: string[]; // Foreign keys to parent User IDs
  teacherIds: string[]; // Assigned teachers
  goals: string[]; // Student-set goals
  preferredMode: 'explorer' | 'facilitator' | null;
  onboardingComplete: boolean;
  assessmentComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Assessment Attempt
interface AssessmentAttempt {
  id: string;
  studentId: string;
  tenantId: string;
  gameId: string; // "pattern_forge", "many_ways_builder", etc.
  attemptNumber: number; // 1, 2, 3... (if retaken)
  startedAt: Date;
  completedAt?: Date;
  status: 'in_progress' | 'completed' | 'abandoned';
  telemetry: {
    timeSpent: number; // seconds
    actions: any[]; // Game-specific action log
    errors: number;
    hintsUsed: number;
    revisions: number;
  };
  rawScores: Record<string, number>; // Game-specific metrics
  normalizedScores: Record<string, number>; // Category scores (0-100)
  reflectionText?: string; // From Game 8
  metadata: Record<string, any>;
}

// Skill Score (aggregated from assessments)
interface SkillScore {
  id: string;
  studentId: string;
  tenantId: string;
  category: 'cognitive_reasoning' | 'creativity' | 'language' | 'memory' | 
            'attention' | 'planning' | 'social_emotional' | 'metacognition' | 
            'character_values';
  score: number; // 0-100
  level: 'emerging' | 'developing' | 'proficient' | 'advanced';
  evidence: string[]; // Supporting data points
  trend: 'improving' | 'stable' | 'needs_attention';
  lastUpdatedAt: Date;
  history: {
    date: Date;
    score: number;
  }[];
}

// AI Report
interface AIReport {
  id: string;
  studentId: string;
  tenantId: string;
  reportType: 'initial_assessment' | 'monthly_progress' | 'goal_review';
  generatedAt: Date;
  studentInsights: {
    strengths: string; // AI-generated text
    growthAreas: string;
    recommendations: string[];
    celebratoryMessage: string;
  };
  parentGuidance: {
    overview: string;
    supportTips: string[];
    redFlags?: string[];
  };
  evidenceUsed: string[]; // IDs of AssessmentAttempts
  metadata: {
    llmModel: string; // "gpt-4-turbo"
    promptVersion: string;
    generationTime: number; // milliseconds
  };
}
```

### 17.3 Behavioral Timeline Models

```typescript
// Behavioral Event
interface BehavioralEvent {
  id: string;
  studentId: string;
  tenantId: string;
  timestamp: Date;
  eventType: 'ethical_decision' | 'reflection' | 'adaptability' | 
              'risk_taking' | 'empathy' | 'persistence';
  context: string; // "Dilemma Compass - Resource Allocation"
  sourceGameId?: string; // Optional link to game
  studentChoice: string; // Description of what student did
  aiAnalysis: {
    valuesReflected: string[]; // ["equity", "empathy"]
    behavioralPattern: string; // "consistent_fairness_orientation"
    growthIndicator: string; // "increased_stakeholder_consideration"
  };
  visibility: 'student_only' | 'student_and_parent' | 'all';
  metadata: Record<string, any>;
}
```

### 17.4 Activity Models (Explorer & Facilitator)

```typescript
// Activity Definition (for both modes)
interface Activity {
  id: string;
  tenantId?: string; // Null for global, specific for custom
  title: string;
  description: string;
  mode: 'explorer' | 'facilitator' | 'both';
  type: 'discovery_quest' | 'daily_challenge' | 'skill_builder' | 
        'reflection' | 'milestone';
  targetCategories: string[]; // Which skills it addresses
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedTime: number; // minutes
  content: Record<string, any>; // Activity-specific content
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Activity Attempt (student's engagement)
interface ActivityAttempt {
  id: string;
  studentId: string;
  tenantId: string;
  activityId: string;
  mode: 'explorer' | 'facilitator';
  startedAt: Date;
  completedAt?: Date;
  status: 'in_progress' | 'completed' | 'skipped';
  telemetry: Record<string, any>; // Activity-specific data
  aiAssessment?: {
    feedback: string;
    skillImpact: Record<string, number>; // Category → score delta
    nextSteps: string[];
  };
  reflectionText?: string;
}
```

### 17.5 Consent & Compliance Models

```typescript
// Consent Record
interface ConsentRecord {
  id: string;
  userId: string; // The user giving consent (parent for minor)
  subjectUserId: string; // The subject (student if minor)
  tenantId: string;
  purpose: 'assessment' | 'data_processing' | 'ai_analysis' | 
           'parent_visibility' | 'teacher_visibility' | 'research';
  granted: boolean;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  expiresAt?: Date; // For time-bound consent
  withdrawnAt?: Date;
  metadata: Record<string, any>;
}

// Audit Log
interface AuditLog {
  id: string;
  tenantId: string;
  userId: string; // Who performed the action
  action: 'create' | 'read' | 'update' | 'delete' | 'export';
  resourceType: 'student' | 'assessment' | 'report' | 'consent' | 'activity';
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
  metadata: Record<string, any>;
}
```

---

## 18. API Endpoints (Key Routes)

### 18.1 Authentication

```
POST   /api/auth/send-otp
POST   /api/auth/verify-otp
POST   /api/auth/logout
GET    /api/auth/session
```

### 18.2 Student

```
GET    /api/students/me                    # Get current student profile
PUT    /api/students/me                    # Update profile
GET    /api/students/me/skill-tree         # Get Skill Tree
GET    /api/students/me/timeline           # Get Behavioral Timeline
GET    /api/students/me/reports            # Get all AI reports
GET    /api/students/me/activities         # Get recommended activities
```

### 18.3 Assessments

```
GET    /api/assessments                    # List available games
POST   /api/assessments/:gameId/start      # Start a game
PUT    /api/assessments/:attemptId/update  # Save progress
POST   /api/assessments/:attemptId/submit  # Submit completed game
```

### 18.4 Activities (Explorer & Facilitator)

```
GET    /api/activities/explorer            # Get Explorer activities
GET    /api/activities/facilitator/daily   # Get today's challenge
POST   /api/activities/:activityId/start   # Start an activity
PUT    /api/activities/:attemptId/submit   # Submit activity
```

### 18.5 Parent

```
GET    /api/parents/children               # List linked children
GET    /api/parents/children/:id/overview  # Child's summary
GET    /api/parents/children/:id/reports   # Child's reports
POST   /api/parents/consent                # Grant/update consent
```

### 18.6 Teacher (B2B)

```
GET    /api/teachers/classes               # Assigned classes
GET    /api/teachers/classes/:id/students  # Student roster
GET    /api/teachers/classes/:id/insights  # Class analytics
GET    /api/teachers/students/:id/report   # Individual report
```

### 18.7 School Admin (B2B)

```
GET    /api/admin/school/stats             # School-wide stats
POST   /api/admin/students/bulk-import     # CSV upload
GET    /api/admin/compliance/consents      # Consent tracking
GET    /api/admin/compliance/audit-logs    # Activity logs
POST   /api/admin/data/export              # DPDP data export
```

### 18.8 Platform Admin (Internal)

```
GET    /api/platform/tenants               # List all tenants
POST   /api/platform/tenants               # Create tenant
PUT    /api/platform/tenants/:id/features  # Toggle features
GET    /api/platform/system/health         # System monitoring
```

---

## 19. MVP Success Metrics

### 19.1 Engagement Metrics

1. **Assessment completion rate > 85%**
   - % of students who complete all 8 preliminary games
   
2. **Avg time per game session < 15 minutes**
   - Ensures games are concise and engaging
   
3. **Mode adoption rate**
   - % choosing Explorer vs. Facilitator
   - Target: 40% Explorer, 60% Facilitator (hypothesis)

4. **Weekly active users (WAU) > 70%**
   - % of enrolled students active at least once per week

### 19.2 Quality Metrics

5. **Parent report open rate > 60%**
   - % of parents who view their child's AI report within 7 days

6. **Reflection quality score > 3.5/5**
   - AI-assessed depth of student reflections (Game 8, checkpoints)

7. **AI report generation time < 30 seconds**
   - Technical performance metric

### 19.3 Business Metrics (B2B)

8. **School retention rate > 90%** (post-trial)
   - % of schools converting from trial to paid

9. **Student capacity utilization > 75%**
   - % of school's purchased licenses actively used

10. **Feature adoption (custom features) > 50%**
    - % of schools using at least one tenant-specific feature

### 19.4 Compliance Metrics

11. **Consent completion rate = 100%**
    - All active students must have valid parental consent

12. **Data export request fulfillment < 48 hours**
    - DPDP compliance: respond to data requests within 2 days

13. **Zero data breaches**
    - Critical security metric

---

## 20. Risks & Guardrails

### 20.1 Educational Risks

1. **Career Determinism**
   - ❌ Avoid: "You should become a doctor"
   - ✅ Instead: "You show interest in problem-solving and helping others"

2. **Medical/Psychiatric Labeling**
   - ❌ Avoid: "Shows signs of ADHD" or "Likely dyslexic"
   - ✅ Instead: "Works better with shorter tasks" + "Consider consulting with educators"

3. **Fixed Mindset Language**
   - ❌ Avoid: "Weak in math" or "Not creative"
   - ✅ Instead: "Developing logical reasoning" or "Exploring creative approaches"

4. **Comparative Ranking**
   - ❌ Avoid: "Top 10% of students" or "Below average"
   - ✅ Instead: Individual growth tracking only

### 20.2 Cultural & Linguistic Risks

5. **Western Bias in Assessments**
   - Ensure scenarios reflect Indian cultural context
   - Use Indian names, settings, examples in games

6. **Language Clarity**
   - Simple English for Grades 8-10
   - Avoid idiomatic expressions
   - Glossary for complex terms

7. **Socioeconomic Assumptions**
   - Don't assume access to technology/resources
   - Avoid scenarios requiring specific family structures

### 20.3 Privacy & Security Risks

8. **Data Breach**
   - Mitigation: Encryption, audit logs, incident response plan
   - Regular penetration testing (quarterly post-MVP)

9. **Cross-Tenant Data Leakage**
   - Mitigation: Strict tenant isolation, automated tests
   - Row-level security policies enforced

10. **Consent Ambiguity**
    - Mitigation: Clear, simple consent language
    - Explicit opt-in for each data use purpose

11. **Third-Party AI Risk**
    - Mitigation: Don't send PII to LLM (anonymize)
    - Use dedicated API keys, monitor usage

### 20.4 Technical Risks

12. **Scalability Bottlenecks**
    - Mitigation: Load testing before school launches
    - Auto-scaling configured and tested

13. **AI Report Quality**
    - Mitigation: Human review of first 100 reports
    - A/B test prompts for quality
    - Collect parent/student feedback

14. **Single Point of Failure**
    - Mitigation: Database replication, backup strategies
    - Multi-region deployment (post-MVP)

---

## 21. Compliance Checklist (DPDP Act 2023)

### 21.1 Pre-Launch Requirements

- [ ] Appoint Data Protection Officer (DPO)
- [ ] Draft Privacy Policy (student-friendly language)
- [ ] Create Consent Management System
- [ ] Implement Data Retention Policy (auto-delete after retention period)
- [ ] Set up Audit Logging
- [ ] Encrypt all PII at rest and in transit
- [ ] Create Data Breach Response Plan
- [ ] Train team on DPDP compliance

### 21.2 Ongoing Compliance

- [ ] Monthly consent audit (ensure all active users have valid consent)
- [ ] Quarterly security review
- [ ] Annual DPDP compliance assessment
- [ ] Prompt response to data subject requests (< 48 hours)
- [ ] Regular backup testing (monthly)
- [ ] Incident log maintenance

### 21.3 User-Facing Features

- [ ] Easy consent withdrawal mechanism
- [ ] One-click data export (JSON/PDF)
- [ ] One-click account deletion (with 30-day grace period)
- [ ] Transparent data usage explanations
- [ ] Parent dashboard with consent controls
- [ ] Grievance redressal contact (email/phone)

---

## 22. Development Roadmap (12-Week MVP)

### Phase 1: Foundation (Weeks 1-3)

**Week 1: Setup & Core Infrastructure**
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up PostgreSQL with multi-tenancy schema
- [ ] Implement authentication (email + OTP)
- [ ] Create tenant middleware and isolation tests
- [ ] Set up Redis for caching and sessions
- [ ] Deploy to staging environment

**Week 2: User Management**
- [ ] User CRUD (students, parents, teachers, admins)
- [ ] Role-based access control (RBAC)
- [ ] Tenant management (create, update, configure)
- [ ] Consent management system
- [ ] Audit logging infrastructure

**Week 3: Onboarding Flows**
- [ ] Student onboarding UI (avatar, goals)
- [ ] Parent consent flow
- [ ] School admin bulk student import
- [ ] Privacy policy and consent screens

### Phase 2: Assessment Engine (Weeks 4-6)

**Week 4: Game Engine Core**
- [ ] Generic game engine framework (reusable components)
- [ ] Game state management (save/resume)
- [ ] Telemetry capture system
- [ ] Timer and progress tracking

**Week 5: Games 1-4**
- [ ] Game 1: Pattern Forge (logic puzzles)
- [ ] Game 2: Many Ways Builder (creative challenge)
- [ ] Game 3: Story Lens (narrative writing)
- [ ] Game 4: Visual Vault (memory game)
- [ ] Scoring and normalization for each

**Week 6: Games 5-8**
- [ ] Game 5: Focus Sprint (attention test)
- [ ] Game 6: Mission Planner (planning simulation)
- [ ] Game 7: Dilemma Compass (ethical scenarios)
- [ ] Game 8: Replay & Reflect (metacognitive reflection)
- [ ] End-to-end assessment flow testing

### Phase 3: AI & Insights (Weeks 7-8)

**Week 7: AI Integration**
- [ ] Set up LLM API (OpenAI/Anthropic)
- [ ] Design prompt templates for report generation
- [ ] Implement background job queue (BullMQ)
- [ ] AI worker for report generation
- [ ] Evidence → Trait mapping logic

**Week 8: Skill Tree & Timeline**
- [ ] Skill Tree visualization (D3.js/Recharts)
- [ ] Score normalization and bucketing
- [ ] Behavioral Timeline data model
- [ ] Timeline UI (event visualization)
- [ ] AI-generated insights and recommendations

### Phase 4: Post-Assessment Pathways (Weeks 9-10)

**Week 9: Explorer Mode**
- [ ] Activity recommendation engine
- [ ] Discovery quest templates (5-10 activities)
- [ ] Explorer dashboard UI
- [ ] AI-powered exploration insights

**Week 10: Facilitator Mode**
- [ ] Daily challenge generator
- [ ] Goal-setting and tracking UI
- [ ] Skill builder activity flow
- [ ] Progress visualization
- [ ] Weekly reflection checkpoints

### Phase 5: Dashboards & Polish (Weeks 11-12)

**Week 11: Multi-User Dashboards**
- [ ] Parent dashboard (read-only insights)
- [ ] Teacher dashboard (class analytics)
- [ ] School admin dashboard (school-wide stats)
- [ ] Platform admin dashboard (multi-tenant ops)

**Week 12: Testing & Launch Prep**
- [ ] End-to-end testing (all user flows)
- [ ] Load testing (simulate 500 concurrent users per school)
- [ ] Security audit (penetration testing)
- [ ] DPDP compliance review
- [ ] Documentation (user guides, API docs)
- [ ] Soft launch with 1-2 pilot schools

---

## 23. Post-MVP Roadmap (Future Enhancements)

### Phase 6: Advanced Features (Months 4-6)

- [ ] Mobile app (React Native or Progressive Web App)
- [ ] Advanced analytics (predictive models, trend analysis)
- [ ] Integration with school ERP/LMS systems
- [ ] Live mentoring/counseling (video calls)
- [ ] Peer collaboration features (study groups, challenges)
- [ ]