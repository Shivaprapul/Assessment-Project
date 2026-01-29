/**
 * Get Today's Quests API Route
 * 
 * Returns today's quest set for Explorer Mode with completion states.
 * Creates a new quest set if one doesn't exist for today.
 * 
 * @module app/api/explorer/today
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedUser } from '@/lib/middleware/auth';
import { withTenantContext } from '@/lib/middleware/tenant';
import { db } from '@/lib/db';
import { generateDailyQuests } from '@/lib/explorer-quests';

/**
 * GET /api/explorer/today
 * 
 * Get today's quest set
 */
export async function GET(req: NextRequest) {
  try {
    // Check if explorer mode is enabled
    if (process.env.EXPLORER_MODE !== 'true') {
      return NextResponse.json(
        {
          success: false,
          error: 'Explorer mode is not enabled. Set EXPLORER_MODE=true in .env',
        },
        { status: 400 }
      );
    }

    return requireAuth(
      withTenantContext(async (req: NextRequest, tenantId: string, user: AuthenticatedUser) => {
        try {
          // Only students can access explorer mode
          if (user.role !== 'STUDENT') {
            return NextResponse.json(
              {
                success: false,
                error: 'Only students can access explorer mode',
              },
              { status: 403 }
            );
          }

          // Get student profile
          const student = await db.studentProfile.findUnique({
            where: {
              userId: user.id,
              tenantId,
            },
          });

          if (!student) {
            return NextResponse.json(
              {
                success: false,
                error: 'Student profile not found',
              },
              { status: 404 }
            );
          }

          // Get today's date (Asia/Kolkata timezone)
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

          // Check if quest set exists for today
          let questSet = await db.dailyQuestSet.findUnique({
            where: {
              studentId_date_mode: {
                studentId: student.id,
                date: new Date(todayStr),
                mode: 'EXPLORER',
              },
            },
          });

          // If no quest set exists, create one (grade-aware with skill score prioritization)
          if (!questSet) {
            const studentGrade = student.currentGrade || 8; // Default to 8 if not set
            
            // Get student skill scores for prioritization
            const skillScores = await db.skillScore.findMany({
              where: {
                studentId: student.id,
                tenantId,
              },
            });
            
            // Convert to record for easier lookup
            const skillScoreMap: Record<string, number> = {};
            skillScores.forEach(score => {
              skillScoreMap[score.category] = score.score;
            });
            
            // Get recent weak signals (rolling 7/14 days) for secondary prioritization
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
            
            // Get recent quest attempts to identify weak signals
            const recentAttempts = await db.questAttempt.findMany({
              where: {
                studentId: student.id,
                tenantId,
                status: 'COMPLETED',
                completedAt: {
                  gte: fourteenDaysAgo,
                },
              },
              select: {
                scoreSummary: true,
                questType: true,
                completedAt: true,
              },
              orderBy: {
                completedAt: 'desc',
              },
            });
            
            // Calculate weak signals: skills with low performance in recent attempts
            const weakSignalMap: Record<string, number> = {};
            recentAttempts.forEach(attempt => {
              const scoreSummary = attempt.scoreSummary as any;
              if (scoreSummary?.skillSignals && Array.isArray(scoreSummary.skillSignals)) {
                const accuracy = scoreSummary.accuracy || 0;
                const normalizedAccuracy = typeof accuracy === 'number' && accuracy <= 1 ? accuracy : accuracy / 100;
                
                // Lower accuracy = stronger weak signal
                const weakSignalStrength = 1 - normalizedAccuracy;
                
                scoreSummary.skillSignals.forEach((skill: string) => {
                  if (!weakSignalMap[skill]) {
                    weakSignalMap[skill] = 0;
                  }
                  // Recent attempts (7 days) get more weight
                  // Handle both Date objects and string timestamps from Prisma
                  const completedAt = attempt.completedAt 
                    ? (attempt.completedAt instanceof Date ? attempt.completedAt : new Date(attempt.completedAt))
                    : new Date();
                  const daysAgo = Math.floor((new Date().getTime() - completedAt.getTime()) / (1000 * 60 * 60 * 24));
                  const timeWeight = daysAgo <= 7 ? 1.5 : 1.0;
                  weakSignalMap[skill] += weakSignalStrength * timeWeight;
                });
              }
            });
            
            // Generate quests (grade-aware, will be prioritized by grade expectations)
            const allQuests = generateDailyQuests(student.id, today, 10, studentGrade); // Generate more than needed
            
            // Import grade-aware selection
            const { selectGradeAwareContent } = await import('@/lib/grade-aware-content');
            const { getEmphasisWeightForGradeSkill } = await import('@/lib/grade-skill-expectations');
            
            // Ensure all quests have gradeApplicability and primarySkills (required for GradeApplicability interface)
            // Type assertion needed because Quest uses string[] but GradeApplicability uses SkillCategory[]
            const questsWithGrade = allQuests.map(quest => ({
              ...quest,
              gradeApplicability: quest.gradeApplicability || [8, 9, 10], // Default to universal
              primarySkills: (quest.primarySkills || []) as any as import('@prisma/client').SkillCategory[], // Cast for type compatibility
              secondarySkills: (quest.secondarySkills || []) as any as import('@prisma/client').SkillCategory[],
            }));
            
            // Prioritize quests: high grade emphasis + low student score + recent weak signals = higher priority
            const prioritizedQuests = questsWithGrade.map(quest => {
              let priority = 0;
              
              // Primary priority: grade emphasis + student skill scores
              if (quest.primarySkills && quest.primarySkills.length > 0) {
                for (const skill of quest.primarySkills) {
                  const emphasisWeight = getEmphasisWeightForGradeSkill(studentGrade as any, skill as any);
                  const studentScore = skillScoreMap[skill] || 50; // Default to 50 if unknown
                  // Higher emphasis + lower score = higher priority
                  priority += emphasisWeight * (100 - studentScore);
                  
                  // Secondary priority: recent weak signals (rolling 7/14 days)
                  const weakSignal = weakSignalMap[skill] || 0;
                  // Add weak signal boost (scaled to not overwhelm primary priority)
                  priority += weakSignal * 0.3; // 30% weight for weak signals
                }
              }
              
              return { quest, priority };
            }).sort((a, b) => b.priority - a.priority).map(item => item.quest);
            
            // Select top 3 quests using grade-aware selection
            // Type assertion: Quest interface is compatible with GradeApplicability when fields are present
            const selectedQuests = selectGradeAwareContent(prioritizedQuests as any, studentGrade as any, 3);
            
            questSet = await db.dailyQuestSet.create({
              data: {
                studentId: student.id,
                tenantId,
                date: new Date(todayStr),
                mode: 'EXPLORER',
                quests: selectedQuests as any,
                gradeAtCreation: studentGrade,
              },
            });
          }

          // Get all quest attempts for today
          const questIds = (questSet.quests as any[]).map((q: any) => q.id);
          const attempts = await db.questAttempt.findMany({
            where: {
              studentId: student.id,
              tenantId,
              questId: { in: questIds },
            },
            select: {
              questId: true,
              status: true,
              completedAt: true,
            },
          });

          // Map attempts to quests
          const attemptMap = new Map(attempts.map(a => [a.questId, a]));
          const questsWithStatus = (questSet.quests as any[]).map((quest: any) => {
            const attempt = attemptMap.get(quest.id);
            return {
              ...quest,
              status: attempt?.status || 'NOT_STARTED',
              completedAt: attempt?.completedAt || null,
              attemptId: attempt ? attempt.questId : null,
            };
          });

          // Calculate completion stats
          const completedCount = questsWithStatus.filter(q => q.status === 'COMPLETED').length;
          const totalQuests = questsWithStatus.length;

          return NextResponse.json(
            {
              success: true,
              data: {
                date: todayStr,
                quests: questsWithStatus,
                progress: {
                  completed: completedCount,
                  total: totalQuests,
                  percentage: totalQuests > 0 ? Math.round((completedCount / totalQuests) * 100) : 0,
                },
              },
            },
            { status: 200 }
          );
        } catch (error: any) {
          console.error('Error in explorer today:', error);
          return NextResponse.json(
            {
              success: false,
              error: error.message || 'Failed to load today\'s quests',
            },
            { status: 500 }
          );
        }
      })
    )(req);
  } catch (error: any) {
    console.error('Error in explorer today wrapper:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

