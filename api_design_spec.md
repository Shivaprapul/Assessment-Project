# API Design Specification

## Document Overview
This document provides comprehensive API design specifications for the Student Assessment & Career Support Platform. It includes all REST endpoints, request/response schemas, authentication requirements, and error handling.

**Target Audience:** Backend engineers, Frontend engineers, QA, AI coding agents (Cursor)  
**Version:** 1.0  
**Last Updated:** January 2026

---

## 1. API Design Principles

### 1.1 General Conventions

- **Base URL:** `https://api.yourplatform.com` or `/api` for Next.js API routes
- **Protocol:** HTTPS only (TLS 1.3)
- **Format:** JSON for request and response bodies
- **Authentication:** Bearer token (JWT) in Authorization header
- **Versioning:** Not required for MVP (future: `/api/v2/...`)
- **Naming:** RESTful resource naming (plural nouns, kebab-case)
- **Status Codes:** Standard HTTP status codes

### 1.2 HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid request body/parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily down |

### 1.3 Standard Response Structure

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response payload
  },
  "meta": {
    "timestamp": "2026-01-21T10:30:00Z",
    "requestId": "uuid"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-01-21T10:30:00Z",
    "requestId": "uuid"
  }
}
```

### 1.4 Pagination

**Request:**
```
GET /api/students?page=1&limit=20&sort=createdAt&order=desc
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 1.5 Filtering & Sorting

**Filtering:**
```
GET /api/students?grade=9&section=A&status=active
```

**Sorting:**
```
GET /api/students?sort=name&order=asc
```

**Multiple sorts:**
```
GET /api/students?sort=grade,name&order=asc,asc
```

### 1.6 Authentication

All authenticated endpoints require:
```
Authorization: Bearer <jwt_token>
```

JWT payload structure:
```json
{
  "userId": "uuid",
  "tenantId": "uuid",
  "role": "student",
  "email": "student@example.com",
  "iat": 1737453000,
  "exp": 1737539400
}
```

---

## 2. Authentication & Authorization API

### 2.1 Send OTP

**Endpoint:** `POST /api/auth/send-otp`  
**Authentication:** None  
**Rate Limit:** 3 requests per 15 minutes per email

**Request:**
```json
{
  "email": "student@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent to your email",
    "expiresIn": 300
  }
}
```

**Error Responses:**
- `400` - Invalid email format
- `404` - Email not found in system
- `429` - Rate limit exceeded

**Implementation Notes:**
```typescript
// app/api/auth/send-otp/route.ts
import { z } from 'zod';

const schema = z.object({
  email: z.string().email()
});

export async function POST(req: Request) {
  const body = await req.json();
  const { email } = schema.parse(body);
  
  // Check rate limit
  const attempts = await redis.get(`otp:attempts:${email}`);
  if (attempts && parseInt(attempts) >= 3) {
    return Response.json(
      { error: { code: 'RATE_LIMIT', message: 'Too many attempts' } },
      { status: 429 }
    );
  }
  
  // Find user
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return Response.json(
      { error: { code: 'USER_NOT_FOUND', message: 'Email not registered' } },
      { status: 404 }
    );
  }
  
  // Generate and send OTP
  const otp = generateOTP();
  await redis.set(`otp:${email}`, otp, 'EX', 300);
  await redis.incr(`otp:attempts:${email}`);
  await redis.expire(`otp:attempts:${email}`, 900);
  
  await sendEmail({
    to: email,
    subject: 'Your Login Code',
    template: 'otp',
    data: { otp, expiresIn: 5 }
  });
  
  return Response.json({
    success: true,
    data: { message: 'OTP sent', expiresIn: 300 }
  });
}
```

---

### 2.2 Verify OTP

**Endpoint:** `POST /api/auth/verify-otp`  
**Authentication:** None  
**Rate Limit:** 5 attempts per 15 minutes per email

**Request:**
```json
{
  "email": "student@example.com",
  "otp": "123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "name": "John Doe",
      "role": "student",
      "tenantId": "uuid"
    },
    "expiresIn": 86400
  }
}
```

**Error Responses:**
- `400` - Invalid OTP format
- `401` - OTP expired or incorrect
- `429` - Too many failed attempts

---

### 2.3 Refresh Token

**Endpoint:** `POST /api/auth/refresh`  
**Authentication:** Required (existing token)  

**Request:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "expiresIn": 86400
  }
}
```

---

### 2.4 Logout

**Endpoint:** `POST /api/auth/logout`  
**Authentication:** Required

**Request:** Empty body

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### 2.5 Get Current Session

**Endpoint:** `GET /api/auth/session`  
**Authentication:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "name": "John Doe",
      "role": "student",
      "tenantId": "uuid",
      "avatar": "https://..."
    },
    "tenant": {
      "id": "uuid",
      "name": "ABC School",
      "subdomain": "abc-school",
      "branding": {
        "logo": "https://...",
        "primaryColor": "#1e40af"
      },
      "features": {
        "explorerMode": true,
        "facilitatorMode": true
      }
    }
  }
}
```

---

## 3. Student API

### 3.1 Get Current Student Profile

**Endpoint:** `GET /api/students/me`  
**Authentication:** Required (student or parent)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "tenantId": "uuid",
    "grade": 9,
    "section": "A",
    "dateOfBirth": "2011-05-15",
    "goals": ["Improve logical reasoning", "Explore creative fields"],
    "preferredMode": "facilitator",
    "onboardingComplete": true,
    "assessmentComplete": true,
    "createdAt": "2026-01-01T00:00:00Z",
    "user": {
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://..."
    }
  }
}
```

---

### 3.2 Update Student Profile

**Endpoint:** `PUT /api/students/me`  
**Authentication:** Required (student only)

**Request:**
```json
{
  "goals": ["Master pattern recognition"],
  "preferredMode": "explorer",
  "avatar": "https://..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    // Updated student profile
  }
}
```

**Validation Rules:**
- `goals`: Array of strings, max 5 items, each max 100 chars
- `preferredMode`: Enum ["explorer", "facilitator"]
- `avatar`: Valid URL or base64 image

---

### 3.3 Get Student Skill Tree

**Endpoint:** `GET /api/students/me/skill-tree`  
**Authentication:** Required (student or parent with consent)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "studentId": "uuid",
    "lastUpdated": "2026-01-15T10:00:00Z",
    "categories": [
      {
        "category": "cognitive_reasoning",
        "name": "Cognitive Reasoning & Intelligence",
        "score": 72,
        "level": "proficient",
        "icon": "🌳",
        "trend": "improving",
        "evidence": [
          "Pattern Forge: Solved 8/10 puzzles (85%)",
          "Explorer: Completed Logic Quest"
        ],
        "history": [
          { "date": "2026-01-01", "score": 65 },
          { "date": "2026-01-15", "score": 72 }
        ]
      },
      {
        "category": "creativity",
        "name": "Creativity & Innovation",
        "score": 58,
        "level": "developing",
        "icon": "🌿",
        "trend": "stable",
        "evidence": [
          "Many Ways Builder: 7 unique solutions attempted"
        ],
        "history": [
          { "date": "2026-01-01", "score": 56 },
          { "date": "2026-01-15", "score": 58 }
        ]
      }
      // ... other categories
    ]
  }
}
```

---

### 3.4 Get Behavioral Timeline

**Endpoint:** `GET /api/students/me/timeline`  
**Authentication:** Required (student or parent with consent)  
**Query Params:** `?startDate=2026-01-01&endDate=2026-01-31`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "studentId": "uuid",
    "events": [
      {
        "id": "uuid",
        "timestamp": "2026-01-10T14:30:00Z",
        "eventType": "ethical_decision",
        "context": "Dilemma Compass - Resource Allocation Scenario",
        "studentChoice": "Prioritized fairness over efficiency",
        "aiAnalysis": {
          "valuesReflected": ["equity", "empathy"],
          "behavioralPattern": "consistent_fairness_orientation",
          "growthIndicator": "Increased consideration of multiple stakeholders"
        },
        "visibility": "student_and_parent"
      },
      {
        "id": "uuid",
        "timestamp": "2026-01-15T10:00:00Z",
        "eventType": "persistence",
        "context": "Pattern Forge - Difficult Puzzle",
        "studentChoice": "Attempted 5 different approaches before solving",
        "aiAnalysis": {
          "valuesReflected": ["perseverance", "growth mindset"],
          "behavioralPattern": "high_persistence",
          "growthIndicator": "Maintains effort despite initial failure"
        },
        "visibility": "student_only"
      }
    ],
    "patterns": {
      "dominant": ["fairness_orientation", "high_persistence"],
      "emerging": ["reflective_thinking"],
      "needsSupport": []
    }
  }
}
```

---

### 3.5 Get Student Reports

**Endpoint:** `GET /api/students/me/reports`  
**Authentication:** Required (student or parent)  
**Query Params:** `?type=initial_assessment&limit=10`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "reportType": "initial_assessment",
      "generatedAt": "2026-01-10T15:00:00Z",
      "studentInsights": {
        "strengths": "You demonstrate strong logical reasoning...",
        "growthAreas": "Creative problem-solving is an area for development...",
        "recommendations": [
          "Try activities that encourage divergent thinking",
          "Practice brainstorming multiple solutions"
        ],
        "celebratoryMessage": "Great job completing all assessments! 🎉"
      },
      "parentGuidance": {
        "overview": "Your child shows strong analytical skills...",
        "supportTips": [
          "Encourage open-ended questions at home",
          "Provide opportunities for creative projects"
        ],
        "redFlags": null
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1
    }
  }
}
```

---

### 3.6 Get Recommended Activities

**Endpoint:** `GET /api/students/me/activities`  
**Authentication:** Required (student)  
**Query Params:** `?mode=facilitator&type=daily_challenge`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "dailyChallenge": {
      "id": "uuid",
      "title": "Pattern Puzzle Pro",
      "description": "Solve advanced pattern sequences",
      "mode": "facilitator",
      "type": "daily_challenge",
      "targetCategories": ["cognitive_reasoning"],
      "difficulty": 3,
      "estimatedTime": 15,
      "status": "not_started"
    },
    "recommended": [
      {
        "id": "uuid",
        "title": "Creative Storytelling",
        "description": "Build stories from random elements",
        "mode": "explorer",
        "type": "discovery_quest",
        "targetCategories": ["creativity", "language"],
        "difficulty": 2,
        "estimatedTime": 20
      }
    ]
  }
}
```

---

## 4. Assessment API

### 4.1 List Available Games

**Endpoint:** `GET /api/assessments`  
**Authentication:** Required (student)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "pattern_forge",
      "name": "Pattern Forge",
      "description": "Discover your logical reasoning abilities",
      "estimatedTime": 10,
      "difficulty": 2,
      "orderIndex": 1,
      "isUnlocked": true,
      "isCompleted": false,
      "thumbnail": "https://..."
    },
    {
      "id": "many_ways_builder",
      "name": "Many Ways Builder",
      "description": "Explore your creativity",
      "estimatedTime": 12,
      "difficulty": 2,
      "orderIndex": 2,
      "isUnlocked": true,
      "isCompleted": false,
      "thumbnail": "https://..."
    }
    // ... other games
  ]
}
```

---

### 4.2 Get Game Configuration

**Endpoint:** `GET /api/assessments/:gameId/config`  
**Authentication:** Required (student)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "gameId": "pattern_forge",
    "name": "Pattern Forge",
    "instructions": "You will see a series of patterns. Choose the next item in the sequence.",
    "config": {
      "totalQuestions": 10,
      "timeLimit": 600,
      "allowPause": true,
      "showTimer": true,
      "questions": [
        {
          "id": "q1",
          "type": "sequence",
          "pattern": [2, 4, 6, 8, "?"],
          "options": [10, 12, 14, 16],
          "correctAnswer": 10
        }
        // ... more questions (not sent to client for security)
      ]
    }
  }
}
```

**Note:** For security, actual correct answers should not be sent to client. Validation happens server-side.

---

### 4.3 Start Assessment

**Endpoint:** `POST /api/assessments/:gameId/start`  
**Authentication:** Required (student)  
**Consent Required:** Yes (assessment purpose)

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "attemptId": "uuid",
    "gameId": "pattern_forge",
    "attemptNumber": 1,
    "startedAt": "2026-01-21T10:00:00Z",
    "status": "in_progress",
    "config": {
      // Game configuration (without answers)
    }
  }
}
```

**Error Responses:**
- `403` - Parental consent required
- `409` - Previous attempt still in progress

---

### 4.4 Update Assessment Progress

**Endpoint:** `PUT /api/assessments/attempts/:attemptId/update`  
**Authentication:** Required (student)

**Request:**
```json
{
  "state": {
    "currentQuestionIndex": 5,
    "answers": [10, 12, null, 16, 18],
    "timeSpent": 300
  },
  "telemetry": {
    "actions": [
      { "timestamp": 1737453600, "action": "answer", "data": { "questionId": "q1", "answer": 10 } },
      { "timestamp": 1737453620, "action": "hint", "data": { "questionId": "q2" } }
    ]
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "attemptId": "uuid",
    "status": "in_progress",
    "lastSaved": "2026-01-21T10:05:00Z"
  }
}
```

---

### 4.5 Submit Assessment

**Endpoint:** `POST /api/assessments/attempts/:attemptId/submit`  
**Authentication:** Required (student)

**Request:**
```json
{
  "answers": [10, 12, 14, 16, 18, 20, 22, 24, 26, 28],
  "telemetry": {
    "timeSpent": 580,
    "actions": [...],
    "errors": 2,
    "hintsUsed": 1,
    "revisions": 3
  },
  "reflectionText": "I found the patterns challenging but enjoyable..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "attemptId": "uuid",
    "status": "completed",
    "completedAt": "2026-01-21T10:10:00Z",
    "rawScores": {
      "correctAnswers": 8,
      "totalQuestions": 10,
      "accuracy": 80,
      "avgTimePerQuestion": 58
    },
    "message": "Great work! Your results are being processed.",
    "nextGame": {
      "id": "many_ways_builder",
      "name": "Many Ways Builder"
    }
  }
}
```

**Background Process:**
- Normalize scores
- Update skill scores
- If Game 8 complete, enqueue AI report generation

---

### 4.6 Get Assessment Results

**Endpoint:** `GET /api/assessments/attempts/:attemptId`  
**Authentication:** Required (student or parent)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "attemptId": "uuid",
    "gameId": "pattern_forge",
    "status": "completed",
    "startedAt": "2026-01-21T10:00:00Z",
    "completedAt": "2026-01-21T10:10:00Z",
    "rawScores": {
      "correctAnswers": 8,
      "totalQuestions": 10,
      "accuracy": 80
    },
    "normalizedScores": {
      "cognitive_reasoning": 72
    },
    "insights": {
      "strengths": ["Pattern recognition", "Sequential thinking"],
      "growthAreas": ["Complex multi-step patterns"]
    }
  }
}
```

---

## 5. Activity API (Explorer & Facilitator Modes)

### 5.1 Get Explorer Activities

**Endpoint:** `GET /api/activities/explorer`  
**Authentication:** Required (student)  
**Query Params:** `?category=creativity&difficulty=2`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "featured": [
      {
        "id": "uuid",
        "title": "Story Remix",
        "description": "Create stories by remixing existing elements",
        "type": "discovery_quest",
        "targetCategories": ["creativity", "language"],
        "difficulty": 2,
        "estimatedTime": 20,
        "thumbnail": "https://...",
        "isNew": true
      }
    ],
    "recommended": [...],
    "recent": [...]
  }
}
```

---

### 5.2 Get Daily Challenge (Facilitator)

**Endpoint:** `GET /api/activities/facilitator/daily`  
**Authentication:** Required (student)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Logic Ladder",
    "description": "Climb the ladder of logical reasoning",
    "type": "daily_challenge",
    "targetCategories": ["cognitive_reasoning"],
    "difficulty": 3,
    "estimatedTime": 15,
    "generatedAt": "2026-01-21T00:00:00Z",
    "expiresAt": "2026-01-21T23:59:59Z",
    "content": {
      // Activity-specific content
    },
    "progress": {
      "status": "not_started",
      "lastAttempt": null
    }
  }
}
```

---

### 5.3 Start Activity

**Endpoint:** `POST /api/activities/:activityId/start`  
**Authentication:** Required (student)

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "attemptId": "uuid",
    "activityId": "uuid",
    "mode": "explorer",
    "status": "in_progress",
    "startedAt": "2026-01-21T10:00:00Z"
  }
}
```

---

### 5.4 Submit Activity

**Endpoint:** `POST /api/activities/attempts/:attemptId/submit`  
**Authentication:** Required (student)

**Request:**
```json
{
  "responses": {
    // Activity-specific responses
  },
  "telemetry": {
    "timeSpent": 1200,
    "actions": [...]
  },
  "reflectionText": "This activity helped me think differently..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "attemptId": "uuid",
    "status": "completed",
    "completedAt": "2026-01-21T10:20:00Z",
    "feedback": {
      "message": "Excellent work on exploring multiple approaches!",
      "insights": "You demonstrated strong creative thinking...",
      "skillImpact": {
        "creativity": 3,
        "cognitive_reasoning": 2
      },
      "nextSteps": [
        "Try the advanced version of this activity",
        "Explore related quests in the Innovation category"
      ]
    }
  }
}
```

**Background Process:**
- Update skill scores
- Generate AI feedback
- Create behavioral events
- Update activity recommendations

---

## 6. Parent API

### 6.1 Get Linked Children

**Endpoint:** `GET /api/parents/children`  
**Authentication:** Required (parent)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "grade": 9,
      "section": "A",
      "avatar": "https://...",
      "assessmentComplete": true,
      "lastActive": "2026-01-21T09:00:00Z",
      "consentStatus": {
        "assessment": true,
        "ai_analysis": true,
        "timeline_visibility": false
      }
    }
  ]
}
```

---

### 6.2 Get Child Overview

**Endpoint:** `GET /api/parents/children/:childId/overview`  
**Authentication:** Required (parent)  
**Consent Required:** Yes (parent_visibility)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "uuid",
      "name": "John Doe",
      "grade": 9
    },
    "skillTreeSummary": {
      "strengths": ["Logical Reasoning", "Planning"],
      "developing": ["Creativity", "Language"],
      "lastUpdated": "2026-01-15T10:00:00Z"
    },
    "recentActivity": {
      "assessmentsCompleted": 8,
      "activitiesThisWeek": 5,
      "currentMode": "facilitator",
      "currentStreak": 7
    },
    "latestReport": {
      "id": "uuid",
      "generatedAt": "2026-01-10T15:00:00Z",
      "summary": "Your child demonstrates strong analytical skills..."
    }
  }
}
```

---

### 6.3 Get Child Reports

**Endpoint:** `GET /api/parents/children/:childId/reports`  
**Authentication:** Required (parent)  
**Consent Required:** Yes (parent_visibility)

**Response:** Same structure as student reports endpoint

---

### 6.4 Manage Consent

**Endpoint:** `POST /api/parents/consent`  
**Authentication:** Required (parent)

**Request:**
```json
{
  "studentId": "uuid",
  "purpose": "timeline_visibility",
  "granted": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "consentId": "uuid",
    "studentId": "uuid",
    "purpose": "timeline_visibility",
    "granted": true,
    "timestamp": "2026-01-21T10:00:00Z",
    "expiresAt": null
  }
}
```

**Audit Log:** All consent actions are automatically logged

---

### 6.5 Withdraw Consent

**Endpoint:** `DELETE /api/parents/consent/:consentId`  
**Authentication:** Required (parent)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Consent withdrawn successfully",
    "consentId": "uuid",
    "withdrawnAt": "2026-01-21T10:00:00Z"
  }
}
```

---

## 7. Teacher API (B2B Only)

### 7.1 Get Assigned Classes

**Endpoint:** `GET /api/teachers/classes`  
**Authentication:** Required (teacher)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Grade 9 - Section A",
      "grade": 9,
      "section": "A",
      "studentCount": 35,
      "assessmentCompletionRate": 85,
      "lastActivity": "2026-01-21T09:00:00Z"
    }
  ]
}
```

---

### 7.2 Get Class Students

**Endpoint:** `GET /api/teachers/classes/:classId/students`  
**Authentication:** Required (teacher)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "grade": 9,
      "section": "A",
      "assessmentComplete": true,
      "lastActive": "2026-01-21T09:00:00Z",
      "overallProgress": 78
    }
  ]
}
```

---

### 7.3 Get Class Insights

**Endpoint:** `GET /api/teachers/classes/:classId/insights`  
**Authentication:** Required (teacher)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "classId": "uuid",
    "totalStudents": 35,
    "assessmentCompletion": 85,
    "skillDistribution": {
      "cognitive_reasoning": { "avg": 68, "median": 70 },
      "creativity": { "avg": 62, "median": 64 }
    },
    "commonStrengths": ["Logical Reasoning", "Planning"],
    "commonChallenges": ["Creative Thinking", "Written Expression"],
    "recommendedActivities": [
      "Group brainstorming exercises",
      "Creative writing workshops"
    ]
  }
}
```

---

### 7.4 Get Student Report (Teacher View)

**Endpoint:** `GET /api/teachers/students/:studentId/report`  
**Authentication:** Required (teacher)  
**Permission:** Only if school policy allows

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "studentId": "uuid",
    "name": "John Doe",
    "skillTreeSummary": {
      // Simplified view, no detailed timeline
    },
    "teacherNotes": "Student shows strong analytical skills..."
  }
}
```

---

## 8. School Admin API (B2B Only)

### 8.1 Get School Statistics

**Endpoint:** `GET /api/admin/school/stats`  
**Authentication:** Required (school_admin)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "tenantId": "uuid",
    "students": {
      "total": 500,
      "active": 450,
      "inactive": 50
    },
    "assessments": {
      "completionRate": 82,
      "avgTimePerStudent": 85
    },
    "engagement": {
      "weeklyActiveUsers": 380,
      "dailyActiveUsers": 120,
      "avgSessionDuration": 18
    },
    "modes": {
      "explorer": 180,
      "facilitator": 270
    }
  }
}
```

---

### 8.2 Bulk Import Students

**Endpoint:** `POST /api/admin/students/bulk-import`  
**Authentication:** Required (school_admin)  
**Content-Type:** multipart/form-data

**Request:**
```
file: students.csv
```

**CSV Format:**
```csv
name,email,grade,section,dateOfBirth,parentEmail
John Doe,john@example.com,9,A,2011-05-15,parent@example.com
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid",
    "message": "Import queued. You will receive an email when complete.",
    "estimatedTime": 120
  }
}
```

**Job Status Endpoint:** `GET /api/admin/jobs/:jobId`

---

### 8.3 Get Consent Tracking

**Endpoint:** `GET /api/admin/compliance/consents`  
**Authentication:** Required (school_admin)  
**Query Params:** `?status=pending&grade=9`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 500,
      "granted": 480,
      "pending": 15,
      "withdrawn": 5
    },
    "students": [
      {
        "studentId": "uuid",
        "name": "John Doe",
        "grade": 9,
        "consentStatus": {
          "assessment": { "granted": true, "date": "2026-01-01" },
          "ai_analysis": { "granted": true, "date": "2026-01-01" },
          "parent_visibility": { "granted": false, "date": null }
        }
      }
    ]
  }
}
```

---

### 8.4 Get Audit Logs

**Endpoint:** `GET /api/admin/compliance/audit-logs`  
**Authentication:** Required (school_admin)  
**Query Params:** `?startDate=2026-01-01&action=read&resourceType=student`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "timestamp": "2026-01-21T10:00:00Z",
      "userId": "uuid",
      "userName": "Teacher Name",
      "action": "read",
      "resourceType": "student",
      "resourceId": "uuid",
      "ipAddress": "192.168.1.1",
      "success": true
    }
  ],
  "meta": {
    "pagination": { ... }
  }
}
```

---

### 8.5 Export School Data

**Endpoint:** `POST /api/admin/data/export`  
**Authentication:** Required (school_admin)

**Request:**
```json
{
  "format": "json",
  "includeStudents": true,
  "includeAssessments": true,
  "includeReports": false
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "exportId": "uuid",
    "message": "Export queued. Download link will be emailed.",
    "estimatedTime": 300
  }
}
```

---

## 9. Platform Admin API (Internal)

### 9.1 List All Tenants

**Endpoint:** `GET /api/platform/tenants`  
**Authentication:** Required (platform_admin)  
**Query Params:** `?status=active&type=school`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "ABC International School",
      "type": "school",
      "subdomain": "abc-school",
      "subscription": {
        "plan": "premium",
        "maxStudents": 1000,
        "startDate": "2026-01-01",
        "endDate": "2027-01-01"
      },
      "studentCount": 500,
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "pagination": { ... }
  }
}
```

---

### 9.2 Create Tenant

**Endpoint:** `POST /api/platform/tenants`  
**Authentication:** Required (platform_admin)

**Request:**
```json
{
  "name": "XYZ School",
  "type": "school",
  "subdomain": "xyz-school",
  "branding": {
    "logo": "https://...",
    "primaryColor": "#1e40af",
    "secondaryColor": "#3b82f6"
  },
  "features": {
    "explorerMode": true,
    "facilitatorMode": true,
    "behavioralTimeline": true
  },
  "subscription": {
    "plan": "basic",
    "startDate": "2026-01-21",
    "endDate": "2027-01-21",
    "maxStudents": 500
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "XYZ School",
    "subdomain": "xyz-school",
    "adminCredentials": {
      "email": "admin@xyz-school.com",
      "tempPassword": "generated-password"
    },
    "onboardingLink": "https://xyz-school.yourplatform.com/onboarding"
  }
}
```

---

### 9.3 Update Tenant Features

**Endpoint:** `PUT /api/platform/tenants/:tenantId/features`  
**Authentication:** Required (platform_admin)

**Request:**
```json
{
  "explorerMode": true,
  "facilitatorMode": false,
  "customFeature1": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "tenantId": "uuid",
    "features": {
      "explorerMode": true,
      "facilitatorMode": false,
      "customFeature1": true
    },
    "updatedAt": "2026-01-21T10:00:00Z"
  }
}
```

**Note:** Feature changes are cached and may take up to 15 minutes to propagate

---

### 9.4 Get System Health

**Endpoint:** `GET /api/platform/system/health`  
**Authentication:** Required (platform_admin)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-21T10:00:00Z",
    "services": {
      "database": {
        "status": "up",
        "responseTime": 12,
        "connections": { "active": 45, "max": 100 }
      },
      "redis": {
        "status": "up",
        "responseTime": 2,
        "memory": { "used": "512MB", "max": "2GB" }
      },
      "jobQueue": {
        "status": "up",
        "jobs": { "waiting": 15, "active": 3, "completed": 1250 }
      },
      "ai": {
        "status": "up",
        "provider": "anthropic",
        "responseTime": 1200
      }
    },
    "metrics": {
      "apiRequests": { "last1h": 5420, "last24h": 125000 },
      "activeUsers": { "now": 1250, "peak24h": 2800 },
      "errorRate": 0.02
    }
  }
}
```

---

## 10. Data Export API (DPDP Compliance)

### 10.1 Request Data Export

**Endpoint:** `POST /api/data/export`  
**Authentication:** Required (student or parent)

**Request:**
```json
{
  "userId": "uuid",
  "formats": ["json", "pdf"]
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "exportId": "uuid",
    "message": "Export request received. Download link will be emailed within 48 hours.",
    "estimatedTime": 3600
  }
}
```

---

### 10.2 Check Export Status

**Endpoint:** `GET /api/data/export/:exportId/status`  
**Authentication:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "exportId": "uuid",
    "status": "completed",
    "requestedAt": "2026-01-21T10:00:00Z",
    "completedAt": "2026-01-21T10:15:00Z",
    "formats": ["json", "pdf"],
    "downloads": {
      "json": "https://secure-download-link.com/export.json",
      "pdf": "https://secure-download-link.com/export.pdf"
    },
    "expiresAt": "2026-01-28T10:15:00Z"
  }
}
```

**Status Values:** `pending`, `processing`, `completed`, `failed`

---

### 10.3 Delete Account & Data

**Endpoint:** `DELETE /api/data/account`  
**Authentication:** Required (student or parent)

**Request:**
```json
{
  "userId": "uuid",
  "confirmation": "DELETE MY DATA"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Account deletion scheduled. You have 30 days to cancel.",
    "scheduledDeletionDate": "2026-02-20T10:00:00Z",
    "cancellationLink": "https://yourplatform.com/cancel-deletion?token=..."
  }
}
```

---

### 10.4 Cancel Account Deletion

**Endpoint:** `POST /api/data/cancel-deletion`  
**Authentication:** Required

**Request:**
```json
{
  "token": "cancellation-token"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Account deletion cancelled successfully"
  }
}
```

---

## 11. WebSocket API (Real-Time Features)

### 11.1 Game Telemetry Stream

**Endpoint:** `wss://yourplatform.com/ws/game/:attemptId`  
**Authentication:** JWT token via query param `?token=...`

**Client → Server Events:**

```json
{
  "event": "action",
  "data": {
    "timestamp": 1737453600,
    "action": "answer",
    "questionId": "q1",
    "answer": 10
  }
}
```

**Server → Client Events:**

```json
{
  "event": "saved",
  "data": {
    "timestamp": 1737453605,
    "message": "Progress saved"
  }
}
```

**Error Handling:**
```json
{
  "event": "error",
  "data": {
    "code": "INVALID_ACTION",
    "message": "Action not recognized"
  }
}
```

---

## 12. Rate Limiting

### 12.1 Rate Limit Rules

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication (send-otp) | 3 requests | 15 minutes |
| Authentication (verify-otp) | 5 attempts | 15 minutes |
| General API (authenticated) | 1000 requests | 1 hour |
| Export/Bulk operations | 5 requests | 1 hour |
| WebSocket connections | 10 connections | 5 minutes |

### 12.2 Rate Limit Headers

**Response Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1737457200
```

**429 Response:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 900
  }
}
```

---

## 13. Error Codes Reference

### 13.1 Authentication Errors (1xxx)

| Code | HTTP | Message |
|------|------|---------|
| 1001 | 401 | Invalid credentials |
| 1002 | 401 | Token expired |
| 1003 | 401 | Invalid token |
| 1004 | 403 | Insufficient permissions |
| 1005 | 429 | Too many login attempts |

### 13.2 Validation Errors (2xxx)

| Code | HTTP | Message |
|------|------|---------|
| 2001 | 400 | Missing required field |
| 2002 | 400 | Invalid email format |
| 2003 | 422 | Validation failed |
| 2004 | 409 | Duplicate entry |

### 13.3 Resource Errors (3xxx)

| Code | HTTP | Message |
|------|------|---------|
| 3001 | 404 | Resource not found |
| 3002 | 409 | Resource conflict |
| 3003 | 410 | Resource deleted |

### 13.4 Consent Errors (4xxx)

| Code | HTTP | Message |
|------|------|---------|
| 4001 | 403 | Parental consent required |
| 4002 | 403 | Consent withdrawn |
| 4003 | 403 | Consent expired |

### 13.5 Service Errors (5xxx)

| Code | HTTP | Message |
|------|------|---------|
| 5001 | 500 | Internal server error |
| 5002 | 503 | Service unavailable |
| 5003 | 504 | Gateway timeout |
| 5004 | 500 | AI service error |

---

## 14. Testing & Mocking

### 14.1 Postman Collection Structure

```
Student Assessment Platform API
├── Authentication
│   ├── Send OTP
│   ├── Verify OTP
│   └── Get Session
├── Students
│   ├── Get Profile
│   ├── Update Profile
│   ├── Get Skill Tree
│   └── Get Timeline
├── Assessments
│   ├── List Games
│   ├── Start Game
│   ├── Update Progress
│   └── Submit Game
├── Activities
│   ├── Get Explorer Activities
│   ├── Get Daily Challenge
│   └── Submit Activity
├── Parents
│   ├── Get Children
│   ├── Get Child Overview
│   └── Manage Consent
├── Teachers
│   ├── Get Classes
│   └── Get Class Insights
└── Admin
    ├── School Stats
    ├── Bulk Import
    └── Audit Logs
```

### 14.2 Mock Data Endpoints (Development Only)

**Endpoint:** `GET /api/mock/:resource`  
**Examples:**
- `/api/mock/students` - Returns mock student data
- `/api/mock/assessments` - Returns mock assessment data
- `/api/mock/skill-tree` - Returns mock skill tree

**Note:** Mock endpoints are disabled in production

---

## 15. Cursor Implementation Instructions

### 15.1 API Route Structure (Next.js)

```typescript
// app/api/students/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';

export const GET = withTenantContext(async (req: NextRequest, tenantId: string) => {
  const session = await getSession(req);
  
  if (!session || session.user.role !== 'student') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Student access required' } },
      { status: 403 }
    );
  }
  
  const student = await db.studentProfile.findUnique({
    where: {
      userId: session.user.id,
      tenantId
    },
    include: {
      user: { select: { name: true, email: true, avatar: true } }
    }
  });
  
  if (!student) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Student not found' } },
      { status: 404 }
    );
  }
  
  return NextResponse.json({
    success: true,
    data: student
  });
});
```

### 15.2 Request Validation with Zod

```typescript
import { z } from 'zod';

const createStudentSchema = z.object({
  goals: z.array(z.string().max(100)).max(5),
  preferredMode: z.enum(['explorer', 'facilitator']).optional(),
  avatar: z.string().url().optional()
});

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createStudentSchema.parse(body);
    
    // Process validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.errors
          }
        },
        { status: 422 }
      );
    }
  }
}
```

### 15.3 Error Handling Utility

```typescript
// lib/api/error-handler.ts
export class APIError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
  }
}

export function handleAPIError(error: unknown) {
  if (error instanceof APIError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      },
      { status: error.statusCode }
    );
  }
  
  // Log unexpected errors
  console.error('Unexpected API error:', error);
  
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    },
    { status: 500 }
  );
}
```

---

## 16. API Documentation

### 16.1 OpenAPI/Swagger Generation

After implementing all endpoints, generate OpenAPI specification:

```bash
npx swagger-jsdoc -d swaggerDef.js app/api/**/*.ts -o openapi.json
```

### 16.2 Interactive API Documentation

Host Swagger UI at `/api-docs` for internal use:

```typescript
// app/api-docs/page.tsx
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function APIDocsPage() {
  return <SwaggerUI url="/openapi.json" />;
}
```

---

## End of API Design Specification

This document should be updated as new endpoints are added or existing ones are modified. All changes must maintain backward compatibility for MVP period.