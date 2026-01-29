# Student Assessment & Career Support Platform

A comprehensive multi-tenant web application for student assessment, skill development, and career support.

## Features

- **Multi-Tenant Architecture**: Complete tenant isolation with Row-Level Security
- **8 Gamified Assessments**: Pattern Forge, Many Ways Builder, Story Lens, Visual Vault, Focus Sprint, Mission Planner, Dilemma Compass, Replay & Reflect
- **AI-Powered Reports**: Personalized insights using OpenAI/Anthropic
- **Skill Tree Visualization**: Interactive skill tracking and growth
- **Behavioral Timeline**: Longitudinal EQ and character tracking
- **Explorer & Facilitator Modes**: Two learning pathways
- **DPDP Act 2023 Compliance**: Full data privacy and consent management
- **Role-Based Access**: Student, Parent, Teacher, School Admin, Platform Admin

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 15+ with Row-Level Security
- **Cache/Queue**: Redis, BullMQ
- **AI**: OpenAI GPT-4 or Anthropic Claude
- **Storage**: AWS S3
- **Authentication**: NextAuth.js with Email + OTP

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- npm or yarn

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd student-assessment-platform
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   - `DATABASE_URL`: PostgreSQL connection string
   - `REDIS_URL`: Redis connection string
   - `NEXTAUTH_SECRET`: Random secret for JWT
   - `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`: AI provider key
   - `DEMO_ASSESSMENTS=true`: Enable demo mode for assessments (server-side)
   - `NEXT_PUBLIC_DEMO_ASSESSMENTS=true`: Enable demo mode (client-side, required for UI)
   - Other service keys as needed
   
   **Note**: For demo mode, both `DEMO_ASSESSMENTS` and `NEXT_PUBLIC_DEMO_ASSESSMENTS` must be set to `true`.

4. **Set up the database:**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
student-assessment-platform/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (student)/         # Student portal
│   ├── (parent)/          # Parent portal
│   ├── (teacher)/         # Teacher portal (B2B)
│   ├── (admin)/           # School admin portal (B2B)
│   ├── (platform)/        # Platform admin (internal)
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── games/            # Game components
│   └── dashboards/       # Dashboard components
├── lib/                  # Utilities and services
│   ├── db.ts            # Prisma client
│   ├── redis.ts         # Redis client
│   ├── auth.ts          # NextAuth config
│   ├── middleware/      # Auth, tenant, consent, audit
│   └── api/             # API utilities
├── prisma/              # Database schema
│   └── schema.prisma
└── public/              # Static assets
```

## Key Features Implementation

### Multi-Tenancy

All database queries are automatically scoped to the user's tenant via:
- Row-Level Security (RLS) policies in PostgreSQL
- Tenant middleware that sets session variables
- Automatic `tenant_id` filtering in all queries

### Authentication

- Email + OTP authentication (no passwords)
- JWT-based sessions
- Role-based access control (RBAC)
- Parental consent management

### Assessment Games

8 gamified assessments that capture:
- Cognitive reasoning
- Creativity
- Language skills
- Memory
- Attention
- Planning
- Social-emotional intelligence
- Metacognition

### AI Integration

- Background job processing with BullMQ
- LLM-powered report generation
- Personalized activity recommendations
- Behavioral pattern analysis

## API Documentation

### Authentication

- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP and create session
- `GET /api/auth/session` - Get current session

### Students

- `GET /api/students/me` - Get current student profile
- `PUT /api/students/me` - Update student profile
- `GET /api/students/me/skill-tree` - Get skill tree
- `GET /api/students/me/timeline` - Get behavioral timeline
- `GET /api/students/me/reports` - Get AI reports

### Assessments

- `GET /api/assessments` - List available games
- `POST /api/assessments/:gameId/start` - Start assessment
- `PUT /api/assessments/attempts/:attemptId/update` - Save progress
- `POST /api/assessments/attempts/:attemptId/submit` - Submit assessment

## Development Guidelines

### Code Standards

- Follow the coding standards in `6_Coding_Standards_Best_Practices.md`
- All functions must have JSDoc comments
- Use TypeScript strictly (no `any` types)
- Follow DRY principles
- Implement proper error handling

### Multi-Tenancy

- **CRITICAL**: Always use `tenant_id` in queries
- Use `withTenantContext` middleware for all API routes
- Never trust `tenant_id` from request body - use JWT token

### Security

- All API routes require authentication
- Role-based access control enforced
- Parental consent required for student actions
- Audit logging for all sensitive operations

## Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

## Testing

```bash
# Run tests (when implemented)
npm test

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## Deployment

### Environment Setup

1. Set up PostgreSQL database
2. Set up Redis instance
3. Configure AWS S3 bucket
4. Set up email service (SendGrid/Twilio)
5. Configure AI provider (OpenAI/Anthropic)

### Build

```bash
npm run build
npm start
```

### Docker (Optional)

```bash
docker-compose up -d
```

## Compliance

This platform is designed to comply with:
- **DPDP Act 2023** (India)
- Data minimization principles
- Right to access, correction, and deletion
- Consent management
- Audit logging

## Support

For issues or questions:
- Check the documentation in the `/docs` folder
- Review the PRD and technical requirements
- Contact the development team

## License

Proprietary - All rights reserved
