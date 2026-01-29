/**
 * Teacher Quest Recommendations API
 * 
 * Returns recommended quests for assignment creation.
 * Uses GradeSkillExpectations, student weak signals, Class Focus, and intent.
 * 
 * @module app/api/teacher/recommend-quests
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { isTeacher } from '@/lib/role-utils';
import { generateDailyQuests, Quest } from '@/lib/explorer-quests';
import { getEmphasisWeightForGradeSkill } from '@/lib/grade-skill-expectations';
import { getActiveClassFocus } from '@/lib/class-focus-prioritization';
import { z } from 'zod';

const RecommendQuestsSchema = z.object({
  studentId: z.string().optional(),
  studentGrade: z.number().min(8).max(10).optional(),
  questCount: z.number().min(1).max(10).default(3),
  questTypes: z.array(z.string()).optional(),
  intent: z.string().optional(),
  gradeScope: z.number().min(8).max(10).optional(),
});

/**
 * GET /api/teacher/recommend-quests
 * 
 * Get recommended quests for assignment creation
 */
export async function GET(req: NextRequest) {
  return requireAuth(
    withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
      try {
        if (!isTeacher(user.role)) {
          return NextResponse.json(
            { success: false, error: 'Only teachers can access quest recommendations' },
            { status: 403 }
          );
        }

        const { searchParams } = new URL(req.url);
        const body = {
          studentId: searchParams.get('studentId') || undefined,
          studentGrade: searchParams.get('studentGrade') ? parseInt(searchParams.get('studentGrade')!) : undefined,
          questCount: searchParams.get('questCount') ? parseInt(searchParams.get('questCount')!) : 3,
          questTypes: searchParams.get('questTypes') ? searchParams.get('questTypes')!.split(',') : undefined,
          intent: searchParams.get('intent') || undefined,
          gradeScope: searchParams.get('gradeScope') ? parseInt(searchParams.get('gradeScope')!) : undefined,
        };

        const validated = RecommendQuestsSchema.parse(body);

        // Get teacher's active ClassSection to determine grade
        const classSection = await db.classSection.findFirst({
          where: {
            tenantId,
            teacherId: user.id,
            isActive: true,
          },
          orderBy: {
            academicYearStart: 'desc',
          },
        });

        const grade = validated.gradeScope || validated.studentGrade || classSection?.grade || 9;

        // Get student skill scores if studentId provided
        let skillScoreMap: Record<string, number> = {};
        let weakSignalMap: Record<string, number> = {};

        if (validated.studentId) {
          const skillScores = await db.skillScore.findMany({
            where: {
              studentId: validated.studentId,
              tenantId,
            },
          });
          skillScoreMap = {};
          skillScores.forEach((ss) => {
            skillScoreMap[ss.category] = ss.score;
          });

          // Get recent weak signals (last 14 days)
          const recentAttempts = await db.questAttempt.findMany({
            where: {
              studentId: validated.studentId,
              tenantId,
              status: 'COMPLETED',
              completedAt: {
                gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
              },
            },
            select: {
              scoreSummary: true,
            },
          });

          recentAttempts.forEach((attempt) => {
            const summary = attempt.scoreSummary as any;
            const signals = summary?.skillSignals || [];
            signals.forEach((signal: string) => {
              weakSignalMap[signal] = (weakSignalMap[signal] || 0) + 1;
            });
          });
        } else {
          // For class-level recommendations, use average skill scores
          const students = await db.studentProfile.findMany({
            where: {
              tenantId,
              ...(classSection ? {
                classSectionId: classSection.id,
                currentGrade: classSection.grade,
              } : {}),
            },
            include: {
              skillScores: true,
            },
            take: 10, // Sample for average
          });

          const skillTotals: Record<string, { sum: number; count: number }> = {};
          students.forEach((student) => {
            student.skillScores.forEach((ss) => {
              if (!skillTotals[ss.category]) {
                skillTotals[ss.category] = { sum: 0, count: 0 };
              }
              skillTotals[ss.category].sum += ss.score;
              skillTotals[ss.category].count += 1;
            });
          });

          Object.keys(skillTotals).forEach((skill) => {
            const { sum, count } = skillTotals[skill];
            skillScoreMap[skill] = count > 0 ? sum / count : 50;
          });
        }

        // Get active Class Focus profile
        const classFocus = await getActiveClassFocus(tenantId, user.id, grade);
        const classFocusBoosts = classFocus?.priorityBoosts || {};

        // Generate quest pool (grade-aware)
        const questPool = generateDailyQuests(
          validated.studentId || 'class',
          new Date(),
          30, // Generate more than needed for selection
          grade
        );

        // Filter by quest types if specified
        let filteredQuests = questPool;
        if (validated.questTypes && validated.questTypes.length > 0) {
          filteredQuests = questPool.filter((q) => validated.questTypes!.includes(q.type));
        }

        // Filter by grade applicability (always applied first)
        filteredQuests = filteredQuests.filter((q) => {
          const gradeApplicability = q.gradeApplicability || [8, 9, 10];
          return gradeApplicability.includes(grade);
        });

        // Calculate priority for each quest
        const prioritizedQuests = filteredQuests.map((quest) => {
          let basePriority = 0;

          // Primary priority: grade emphasis + student skill scores
          if (quest.primarySkills && quest.primarySkills.length > 0) {
            for (const skill of quest.primarySkills) {
              const emphasisWeight = getEmphasisWeightForGradeSkill(grade as any, skill as any);
              const studentScore = skillScoreMap[skill] || 50;
              // Higher emphasis + lower score = higher priority
              basePriority += emphasisWeight * (100 - studentScore);

              // Secondary priority: recent weak signals
              const weakSignal = weakSignalMap[skill] || 0;
              basePriority += weakSignal * 0.3;
            }
          }

          // Apply Class Focus boost (capped at 0.20)
          let finalPriority = basePriority;
          if (Object.keys(classFocusBoosts).length > 0 && quest.primarySkills) {
            for (const skill of quest.primarySkills) {
              const boost = classFocusBoosts[skill] || 0;
              const cappedBoost = Math.min(0.20, Math.max(0, boost));
              finalPriority = basePriority * (1 + cappedBoost);
              break; // Apply boost once per quest
            }
          }

          // Intent-based boost
          if (validated.intent && quest.primarySkills) {
            const intentSkillMap: Record<string, string[]> = {
              IMPROVE_FOCUS: ['ATTENTION', 'METACOGNITION'],
              STRENGTHEN_PLANNING: ['PLANNING', 'METACOGNITION'],
              ENCOURAGE_COMMUNICATION: ['LANGUAGE', 'SOCIAL_EMOTIONAL'],
              BUILD_CONSISTENCY: ['PLANNING', 'METACOGNITION'],
              PREPARE_FOR_EXAMS: ['COGNITIVE_REASONING', 'MEMORY', 'PLANNING'],
              REENGAGE_PARTICIPATION: ['CREATIVITY', 'SOCIAL_EMOTIONAL'],
            };
            const intentSkills = intentSkillMap[validated.intent] || [];
            if (quest.primarySkills.some((s) => intentSkills.includes(s))) {
              finalPriority *= 1.2; // 20% boost for intent match
            }
          }

          return {
            quest,
            priority: finalPriority,
          };
        });

        // Sort by priority and select top N
        const selectedQuests = prioritizedQuests
          .sort((a, b) => b.priority - a.priority)
          .slice(0, validated.questCount)
          .map((item) => ({
            id: item.quest.id,
            type: item.quest.type, // 'mini_game', 'reflection', 'choice_scenario'
            title: item.quest.title,
            description: item.quest.description,
            estimatedTime: item.quest.estimatedTime,
            primarySkills: item.quest.primarySkills || [],
            skillSignals: item.quest.skillSignals || [],
            gradeApplicability: item.quest.gradeApplicability || [8, 9, 10],
          }));

        // In DEMO_TEACHER mode, return deterministic mock data
        if (process.env.DEMO_TEACHER === 'true') {
          const mockQuests = Array.from({ length: validated.questCount }).map((_, idx) => ({
            id: `demo-quest-${idx + 1}`,
            type: ['mini_game', 'reflection', 'choice_scenario'][idx % 3],
            title: ['Pattern Challenge', 'Daily Reflection', 'Decision Scenario'][idx % 3],
            description: ['Complete pattern recognition tasks', 'Reflect on your learning', 'Navigate a decision scenario'][idx % 3],
            estimatedTime: [5, 3, 4][idx % 3],
            primarySkills: [['COGNITIVE_REASONING'], ['METACOGNITION'], ['PLANNING']][idx % 3],
            skillSignals: [['COGNITIVE_REASONING'], ['METACOGNITION'], ['PLANNING']][idx % 3],
            gradeApplicability: [8, 9, 10],
          }));
          return NextResponse.json({
            success: true,
            data: {
              quests: mockQuests,
            },
          });
        }

        return NextResponse.json({
          success: true,
          data: {
            quests: selectedQuests,
          },
        });
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { success: false, error: 'Invalid input', details: error.issues },
            { status: 400 }
          );
        }
        console.error('Error recommending quests:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to recommend quests' },
          { status: 500 }
        );
      }
    })
  )(req);
}

