# Tech Stack and Architecture
## Student Assessment & Career Support Platform

**Version:** 1.0  
**Last Updated:** January 2026  
**Purpose:** Complete technical architecture for AI coding agents (Cursor)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CDN (CloudFlare/AWS)                    │
│                  Static Assets + Game Resources              │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Load Balancer (AWS ALB)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐           ┌────────▼────────┐
│  Next.js App   │           │  Next.js App    │
│  (Container 1) │           │  (Container N)  │
│                │           │                 │
│  - Frontend    │           │  - Frontend     │
│  - API Routes  │           │  - API Routes   │
│  - SSR/RSC     │           │  - SSR/RSC      │
└───────┬────────┘           └────────┬────────┘
        │                             │
        └──────────────┬──────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐           ┌────────▼────────┐
│   PostgreSQL   │           │     Redis       │
│   (Primary)    │           │   - Sessions    │
│                │◄──────────┤   - Cache       │
│  - Multi-tenant│           │   - Job Queue   │
│  - Row-level   │           └─────────────────┘
│    Security    │
└───────┬────────┘
        │
┌───────▼────────┐
│   PostgreSQL   │
│  (Read Replica)│
└────────────────┘

        ┌──────────────┐
        │  BullMQ      │
        │  Workers     │
        │              │
        │  - AI Report │
        │  - Email     │
        │  - Analytics │
        └──────┬───────┘
               │
        ┌──────▼───────┐
        │  External    │
        │  Services    │
        │              │
        │  - OpenAI    │
        │  - SendGrid  │
        │  - AWS S3    │
        └──────────────┘
```

### 1.2 Multi-Tenancy Architecture

**Pattern:** Shared Database, Shared Schema with Row-Level Security (RLS)

**Rationale:**
- Cost-effective for MVP (10-15 schools)
- Easier to manage than separate databases
- PostgreSQL RLS provides strong isolation
- Scalable to 100+ tenants

**Tenant Isolation Strategy:**
```sql
-- Every table has tenant_id
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  -- other fields
);

-- Row-Level Security Policy
CREATE POLICY tenant_isolation ON students
  USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Set tenant context per request
SET app.current_tenant = 'school-uuid-here';
```

**Middleware Enforcement:**
```typescript
// Every API request sets tenant context
export async function tenantMiddleware(req: NextRequest) {
  const user = await getSession(req);
  if (!user?.tenantId) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Set tenant context for database queries
  await db.$executeRaw`SET app.current_tenant = ${user.tenantId}`;
  
  // Pass tenant to request context
  req.tenant = { id: user.tenantId, ...tenantData };
  return next();
}
```

---

## 2. Frontend Stack

### 2.1 Core Framework

**Next.js 14+ (App Router)**

```json
{
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.0"
  }
}
```

**Why Next.js:**
- Server-side rendering for SEO and performance
- API routes for backend logic
- React Server Components for reduced bundle size
- Built-in optimization (images, fonts, code splitting)
- Vercel deployment (easy scaling)

**App Router Structure:**
```
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── verify-otp/page.tsx
│   └── onboarding/page.tsx
├── (student)/
│   ├── layout.tsx
│   ├── dashboard/page.tsx
│   ├── games/[gameId]/page.tsx
│   ├── skill-tree/page.tsx
│   ├── timeline/page.tsx
│   ├── explorer/page.tsx
│   └── facilitator/page.tsx
├── (parent)/
│   ├── layout.tsx
│   └── dashboard/page.tsx
├── (teacher)/
│   ├── layout.tsx
│   └── classes/page.tsx
├── (admin)/
│   ├── layout.tsx
│   └── school/page.tsx
├── (platform)/
│   ├── layout.tsx
│   └── tenants/page.tsx
└── api/
    ├── auth/
    ├── students/
    ├── assessments/
    └── activities/
```

### 2.2 Styling & UI

**Tailwind CSS + shadcn/ui**

```json
{
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

**Install shadcn/ui components:**
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog input label
npx shadcn-ui@latest add select tabs toast dropdown-menu
npx shadcn-ui@latest add avatar badge progress separator
```

**Framer Motion (Animations):**
```json
{
  "dependencies": {
    "framer-motion": "^10.16.0"
  }
}
```

### 2.3 State Management

**React Context + TanStack Query + Zustand**

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.17.0",
    "zustand": "^4.4.0"
  }
}
```

**Usage Pattern:**
```typescript
// Global state (user, tenant) - Context
import { createContext } from 'react';
export const TenantContext = createContext<Tenant | null>(null);

// Server state (API data) - TanStack Query
import { useQuery } from '@tanstack/react-query';
function SkillTree() {
  const { data } = useQuery({
    queryKey: ['skill-tree', studentId],
    queryFn: () => fetch('/api/students/me/skill-tree').then(r => r.json())
  });
}

// Client state (game progress) - Zustand
import { create } from 'zustand';
const useGameStore = create((set) => ({
  score: 0,
  incrementScore: () => set((state) => ({ score: state.score + 1 }))
}));
```

### 2.4 Game Engine & Visualizations

**HTML5 Canvas + React + Recharts/D3**

```json
{
  "dependencies": {
    "recharts": "^2.10.0",
    "d3": "^7.8.0",
    "@types/d3": "^7.4.0",
    "konva": "^9.2.0",
    "react-konva": "^18.2.0"
  }
}
```

---

## 3. Backend Stack

### 3.1 API Layer

**Next.js API Routes (Recommended for MVP)**

```typescript
// app/api/students/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Tenant isolation
  await db.$executeRaw`SET app.current_tenant = ${session.tenantId}`;
  
  const student = await db.student.findUnique({
    where: { userId: session.userId },
    include: { skillScores: true }
  });
  
  return NextResponse.json(student);
}
```

### 3.2 Authentication

**NextAuth.js with Custom OTP Provider**

```json
{
  "dependencies": {
    "next-auth": "^4.24.0",
    "@auth/prisma-adapter": "^1.0.0"
  }
}
```

**Configuration:**
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db';
import { sendOTP } from '@/lib/email';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {},
      from: 'no-reply@platform.com',
      generateVerificationToken: () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
      },
      async sendVerificationRequest({ identifier, token }) {
        await sendOTP(identifier, token);
      }
    })
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.role = user.role;
      session.user.tenantId = user.tenantId;
      return session;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### 3.3 Role-Based Access Control (RBAC)

```typescript
// lib/rbac.ts
export enum Role {
  STUDENT = 'student',
  PARENT = 'parent',
  TEACHER = 'teacher',
  SCHOOL_ADMIN = 'school_admin',
  PLATFORM_ADMIN = 'platform_admin'
}

export enum Permission {
  READ_STUDENT_DATA = 'read:student_data',
  WRITE_STUDENT_DATA = 'write:student_data',
  READ_CLASS_DATA = 'read:class_data',
  MANAGE_SCHOOL = 'manage:school',
  MANAGE_TENANTS = 'manage:tenants'
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.STUDENT]: [Permission.READ_STUDENT_DATA, Permission.WRITE_STUDENT_DATA],
  [Role.PARENT]: [Permission.READ_STUDENT_DATA],
  [Role.TEACHER]: [Permission.READ_STUDENT_DATA, Permission.READ_CLASS_DATA],
  [Role.SCHOOL_ADMIN]: [Permission.READ_CLASS_DATA, Permission.MANAGE_SCHOOL],
  [Role.PLATFORM_ADMIN]: [Permission.MANAGE_TENANTS]
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) || false;
}

// Middleware
export function requirePermission(permission: Permission) {
  return async (req: NextRequest) => {
    const session = await getSession(req);
    if (!session || !hasPermission(session.user.role, permission)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  };
}
```

---

## 4. Database Stack

### 4.1 PostgreSQL with Prisma ORM

**Version:** PostgreSQL 15+

```json
{
  "devDependencies": {
    "@prisma/client": "^5.8.0",
    "prisma": "^5.8.0"
  }
}
```

**Prisma Schema (Complete):**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============= CORE TENANT MODELS =============

model Tenant {
  id                String   @id @default(uuid())
  name              String
  type              TenantType
  subdomain         String   @unique
  customDomain      String?
  branding          Json     @default("{}")
  features          Json     @default("{}")
  subscription      Json     @default("{}")
  dataRetentionDays Int      @default(730)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  users             User[]
  students          StudentProfile[]
  activities        Activity[]
  
  @@index([subdomain])
}

enum TenantType {
  SCHOOL
  B2C
}

model User {
  id            String   @id @default(uuid())
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  email         String
  role          UserRole
  name          String
  phone         String?
  avatar        String?
  metadata      Json     @default("{}")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastLoginAt   DateTime?
  
  studentProfile  StudentProfile?
  consentRecords  ConsentRecord[]
  auditLogs       AuditLog[]
  
  @@unique([tenantId, email])
  @@index([tenantId, role])
}

enum UserRole {
  STUDENT
  PARENT
  TEACHER
  SCHOOL_ADMIN
  PLATFORM_ADMIN
}

// ============= STUDENT MODELS =============

model StudentProfile {
  id                  String   @id @default(uuid())
  userId              String   @unique
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenantId            String
  tenant              Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  grade               Int
  section             String?
  dateOfBirth         DateTime
  parentIds           String[]
  teacherIds          String[]
  goals               String[] @default([])
  preferredMode       Mode?
  onboardingComplete  Boolean  @default(false)
  assessmentComplete  Boolean  @default(false)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  assessmentAttempts  AssessmentAttempt[]
  skillScores         SkillScore[]
  aiReports           AIReport[]
  behavioralEvents    BehavioralEvent[]
  activityAttempts    ActivityAttempt[]
  
  @@index([tenantId])
  @@index([grade])
}

enum Mode {
  EXPLORER
  FACILITATOR
}

// ============= ASSESSMENT MODELS =============

model AssessmentAttempt {
  id               String   @id @default(uuid())
  studentId        String
  student          StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  tenantId         String
  gameId           String
  attemptNumber    Int      @default(1)
  startedAt        DateTime @default(now())
  completedAt      DateTime?
  status           AttemptStatus @default(IN_PROGRESS)
  telemetry        Json     @default("{}")
  rawScores        Json     @default("{}")
  normalizedScores Json     @default("{}")
  reflectionText   String?
  metadata         Json     @default("{}")
  
  @@index([studentId, gameId])
  @@index([tenantId])
}

enum AttemptStatus {
  IN_PROGRESS
  COMPLETED
  ABANDONED
}

model SkillScore {
  id            String   @id @default(uuid())
  studentId     String
  student       StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  tenantId      String
  category      SkillCategory
  score         Float
  level         SkillLevel
  evidence      String[] @default([])
  trend         Trend
  lastUpdatedAt DateTime @default(now())
  history       Json     @default("[]")
  
  @@unique([studentId, category])
  @@index([tenantId])
}

enum SkillCategory {
  COGNITIVE_REASONING
  CREATIVITY
  LANGUAGE
  MEMORY
  ATTENTION
  PLANNING
  SOCIAL_EMOTIONAL
  METACOGNITION
  CHARACTER_VALUES
}

enum SkillLevel {
  EMERGING
  DEVELOPING
  PROFICIENT
  ADVANCED
}

enum Trend {
  IMPROVING
  STABLE
  NEEDS_ATTENTION
}

model AIReport {
  id              String   @id @default(uuid())
  studentId       String
  student         StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  tenantId        String
  reportType      ReportType
  generatedAt     DateTime @default(now())
  studentInsights Json     @default("{}")
  parentGuidance  Json     @default("{}")
  evidenceUsed    String[] @default([])
  metadata        Json     @default("{}")
  
  @@index([studentId, reportType])
  @@index([tenantId])
}

enum ReportType {
  INITIAL_ASSESSMENT
  MONTHLY_PROGRESS
  GOAL_REVIEW
}

// ============= BEHAVIORAL TIMELINE =============

model BehavioralEvent {
  id            String   @id @default(uuid())
  studentId     String
  student       StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  tenantId      String
  timestamp     DateTime @default(now())
  eventType     EventType
  context       String
  sourceGameId  String?
  studentChoice String
  aiAnalysis    Json     @default("{}")
  visibility    Visibility
  metadata      Json     @default("{}")
  
  @@index([studentId, timestamp])
  @@index([tenantId])
}

enum EventType {
  ETHICAL_DECISION
  REFLECTION
  ADAPTABILITY
  RISK_TAKING
  EMPATHY
  PERSISTENCE
}

enum Visibility {
  STUDENT_ONLY
  STUDENT_AND_PARENT
  ALL
}

// ============= ACTIVITY MODELS =============

model Activity {
  id              String   @id @default(uuid())
  tenantId        String?
  tenant          Tenant?  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  title           String
  description     String
  mode            Mode[]
  type            ActivityType
  targetCategories String[]
  difficulty      Int
  estimatedTime   Int
  content         Json     @default("{}")
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  attempts        ActivityAttempt[]
  
  @@index([tenantId])
  @@index([difficulty])
}

enum ActivityType {
  DISCOVERY_QUEST
  DAILY_CHALLENGE
  SKILL_BUILDER
  REFLECTION
  MILESTONE
}

model ActivityAttempt {
  id            String   @id @default(uuid())
  studentId     String
  student       StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  tenantId      String
  activityId    String
  activity      Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  mode          Mode
  startedAt     DateTime @default(now())
  completedAt   DateTime?
  status        AttemptStatus
  telemetry     Json     @default("{}")
  aiAssessment  Json?
  reflectionText String?
  
  @@index([studentId, mode])
  @@index([tenantId])
}

// ============= COMPLIANCE MODELS =============

model ConsentRecord {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  subjectUserId   String
  tenantId        String
  purpose         ConsentPurpose
  granted         Boolean
  timestamp       DateTime @default(now())
  ipAddress       String
  userAgent       String
  expiresAt       DateTime?
  withdrawnAt     DateTime?
  metadata        Json     @default("{}")
  
  @@index([subjectUserId, purpose])
  @@index([tenantId])
}

enum ConsentPurpose {
  ASSESSMENT
  DATA_PROCESSING
  AI_ANALYSIS
  PARENT_VISIBILITY
  TEACHER_VISIBILITY
  RESEARCH
}

model AuditLog {
  id            String   @id @default(uuid())
  tenantId      String
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  action        Action
  resourceType  ResourceType
  resourceId    String
  ipAddress     String
  userAgent     String
  timestamp     DateTime @default(now())
  success       Boolean
  errorMessage  String?
  metadata      Json     @default("{}")
  
  @@index([tenantId, timestamp])
  @@index([userId, timestamp])
  @@index([resourceType, resourceId])
}

enum Action {
  CREATE
  READ
  UPDATE
  DELETE
  EXPORT
}

enum ResourceType {
  STUDENT
  ASSESSMENT
  REPORT
  CONSENT
  ACTIVITY
}
```

**Row-Level Security Setup:**
```sql
-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudentProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AssessmentAttempt" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY tenant_isolation_users ON "User"
  USING ("tenantId" = current_setting('app.current_tenant', true)::text);

CREATE POLICY tenant_isolation_students ON "StudentProfile"
  USING ("tenantId" = current_setting('app.current_tenant', true)::text);
```

### 4.2 Redis Configuration

**Use Cases:**
- Session storage
- OTP caching
- Rate limiting
- Job queue (BullMQ)
- Caching frequently accessed data

```typescript
// lib/redis.ts
import { Redis } from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL!);

// Session storage
export async function setSession(sessionId: string, data: any, ttl = 3600) {
  await redis.setex(`session:${sessionId}`, ttl, JSON.stringify(data));
}

export async function getSession(sessionId: string) {
  const data = await redis.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
}

// Rate limiting
export async function checkRateLimit(key: string, limit: number, window: number) {
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, window);
  }
  return current <= limit;
}
```

### 4.3 File Storage (AWS S3)

```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.478.0",
    "@aws-sdk/s3-request-presigner": "^3.478.0"
  }
}
```

```typescript
// lib/storage.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

export async function uploadFile(
  tenantId: string,
  path: string,
  file: Buffer,
  contentType: string
) {
  const key = `${tenantId}/${path}`;
  
  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: file,
    ContentType: contentType,
    ServerSideEncryption: 'AES256'
  }));
  
  return key;
}

export async function getSignedDownloadUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key
  });
  
  return await getSignedUrl(s3, command, { expiresIn });
}
```

---

## 5. AI/ML Stack

### 5.1 LLM Integration

**OpenAI GPT-4 or Anthropic Claude**

```json
{
  "dependencies": {
    "openai": "^4.20.0"
  }
}
```

```typescript
// lib/ai/llm.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

export async function generateStudentReport(
  studentData: any,
  assessmentData: any
) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an educational psychologist analyzing student performance. 
                  Generate insights in a growth-oriented, encouraging tone.
                  Avoid medical diagnoses or career determinism.`
      },
      {
        role: 'user',
        content: `Student: ${JSON.stringify(studentData)}
                  Assessments: ${JSON.stringify(assessmentData)}
                  
                  Generate:
                  1. Key strengths (2-3 sentences)
                  2. Growth areas (2-3 sentences)
                  3. Recommendations (3 specific suggestions)
                  4. Parent guidance (how to support at home)`
      }
    ],
    temperature: 0.4,
    max_tokens: 1500
  });
  
  return completion.choices[0].message.content;
}
```

### 5.2 Background Job Processing

**BullMQ (Redis-based Queue)**

```json
{
  "dependencies": {
    "bullmq": "^5.1.0"
  }
}
```

```typescript
// lib/queue/ai-report-queue.ts
import { Queue, Worker } from 'bullmq';
import { redis } from '@/lib/redis';
import { generateStudentReport } from '@/lib/ai/llm';
import { db } from '@/lib/db';

export const aiReportQueue = new Queue('ai-reports', {
  connection: redis
});

// Add job to queue
export async function queueAIReport(studentId: string, assessmentIds: string[]) {
  await aiReportQueue.add('generate-report', {
    studentId,
    assessmentIds
  });
}

// Worker to process jobs
const worker = new Worker('ai-reports', async (job) => {
  const { studentId, assessmentIds } = job.data;
  
  // Fetch data
  const student = await db.studentProfile.findUnique({
    where: { id: studentId },
    include: { user: true, skillScores: true }
  });
  
  const assessments = await db.assessmentAttempt.findMany({
    where: { id: { in: assessmentIds } }
  });
  
  // Generate report
  const reportContent = await generateStudentReport(student, assessments);
  
  // Save to database
  await db.aiReport.create({
    data: {
      studentId,
      tenantId: student.tenantId,
      reportType: 'INITIAL_ASSESSMENT',
      studentInsights: JSON.parse(reportContent),
      parentGuidance: {},
      evidenceUsed: assessmentIds,
      metadata: {
        llmModel: 'gpt-4-turbo',
        generationTime: Date.now()
      }
    }
  });
}, { connection: redis });

worker.on('completed', (job) => {
  console.log(`Report generated for job ${job.id}`);
});

worker.on('failed', (job, err) => {
  console.error(`Report generation failed for job ${job?.id}:`, err);
});
```

---

## 6. Infrastructure & Deployment

### 6.1 Development Environment

**Docker Compose Setup:**
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: eduplatform
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/eduplatform
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - .:/app
      - /app/node_modules

volumes:
  postgres_data:
  redis_data:
```

### 6.2 Production Deployment

**Vercel (Recommended for MVP):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Environment Variables:**
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379

# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://platform.com

# Email (OTP)
SENDGRID_API_KEY=your-key

# AI
OPENAI_API_KEY=your-key

# Storage
AWS_S3_BUCKET=your-bucket
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

### 6.3 Scaling Strategy

**Horizontal Scaling:**
- Containerize with Docker
- Deploy to Kubernetes or AWS ECS
- Auto-scaling based on CPU/memory

**Database Scaling:**
- Read replicas for queries
- Connection pooling (PgBouncer)
- Caching with Redis

**CDN:**
- CloudFlare or AWS CloudFront
- Cache static assets and game resources

---

## 7. Monitoring & Observability

### 7