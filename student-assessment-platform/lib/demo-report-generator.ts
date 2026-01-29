/**
 * Demo AI Report Generator
 * 
 * Generates a comprehensive AI-style report using templates and assessment results.
 * Marked as demoGenerated: true for easy replacement later.
 * 
 * @module lib/demo-report-generator
 */

import { db } from './db';
import { getAllGames } from './games';

interface ReportData {
  studentInsights: {
    strengths: string;
    growthAreas: string;
    recommendations: string[];
    celebratoryMessage: string;
  };
  parentGuidance: {
    overview: string;
    supportTips: string[];
    redFlags?: string[];
  };
  evidenceUsed: string[];
  metadata: {
    demoGenerated: boolean;
    generationTime: number;
  };
}

/**
 * Generate a comprehensive demo report from all 8 game results
 */
export async function generateDemoReport(
  studentId: string,
  tenantId: string,
  completedGameIds: string[]
): Promise<string> {
  // Get all completed attempts
  const attempts = await db.assessmentAttempt.findMany({
    where: {
      studentId,
      tenantId,
      gameId: { in: completedGameIds },
      status: 'COMPLETED',
    },
    orderBy: {
      completedAt: 'asc',
    },
  });

  if (attempts.length === 0) {
    throw new Error('No completed assessments found');
  }

  // Aggregate scores by category
  const categoryScores: Record<string, number[]> = {};
  attempts.forEach((attempt) => {
    const scores = attempt.normalizedScores as Record<string, number>;
    Object.entries(scores).forEach(([category, score]) => {
      if (!categoryScores[category]) {
        categoryScores[category] = [];
      }
      categoryScores[category].push(score);
    });
  });

  // Calculate average scores per category
  const avgScores: Record<string, number> = {};
  Object.entries(categoryScores).forEach(([category, scores]) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    avgScores[category] = Math.round(avg);
  });

  // Identify top strengths (top 3 categories)
  const sortedCategories = Object.entries(avgScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const topStrengths = sortedCategories.map(([cat]) => {
    const categoryNames: Record<string, string> = {
      'cognitive_reasoning': 'Logical Reasoning',
      'creativity': 'Creative Thinking',
      'language': 'Language & Communication',
      'memory': 'Memory & Recall',
      'attention': 'Focus & Attention',
      'planning': 'Planning & Organization',
      'social_emotional': 'Social & Emotional Intelligence',
      'metacognition': 'Metacognition & Self-Awareness',
      'character_values': 'Character & Values',
    };
    return categoryNames[cat] || cat;
  });

  // Identify growth areas (bottom 3 categories, but frame positively)
  const growthCategories = Object.entries(avgScores)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 3)
    .filter(([, score]) => score < 80); // Only include if below 80

  const growthAreas = growthCategories.map(([cat]) => {
    const categoryNames: Record<string, string> = {
      'cognitive_reasoning': 'Logical Reasoning',
      'creativity': 'Creative Expression',
      'language': 'Language Skills',
      'memory': 'Memory Strategies',
      'attention': 'Sustained Focus',
      'planning': 'Planning Skills',
      'social_emotional': 'Social Awareness',
      'metacognition': 'Self-Reflection',
      'character_values': 'Value-Based Decision Making',
    };
    return categoryNames[cat] || cat;
  });

  // Generate report content
  const reportData: ReportData = {
    studentInsights: {
      strengths: `Your child demonstrates strong abilities in ${topStrengths.join(', ')}. These natural strengths show consistent performance across multiple assessment activities, indicating solid foundational skills in these areas.`,
      growthAreas: growthAreas.length > 0
        ? `There are opportunities for continued growth in ${growthAreas.join(', ')}. These areas show potential for development through targeted practice and supportive learning experiences.`
        : `Your child shows balanced development across all skill areas. Continued engagement with diverse learning activities will help maintain this well-rounded growth.`,
      recommendations: [
        `Encourage activities that build on strengths in ${topStrengths[0] || 'their natural abilities'}`,
        growthAreas.length > 0
          ? `Provide gentle support and practice opportunities for ${growthAreas[0]}`
          : 'Continue exploring diverse learning experiences',
        'Celebrate effort and progress, not just outcomes',
        'Maintain a growth mindset and curiosity about learning',
      ],
      celebratoryMessage: `Congratulations on completing all 8 assessment games! Your dedication and effort throughout this journey show a strong commitment to learning and self-discovery. Each game you completed represents valuable insights into your unique learning style and strengths.`,
    },
    parentGuidance: {
      overview: `Based on the comprehensive assessment results, your child has completed all 8 preliminary games. The results show a balanced profile with clear strengths and areas for continued growth. This assessment provides a foundation for personalized learning recommendations.`,
      supportTips: [
        `Support your child's natural strengths in ${topStrengths[0] || 'their areas of interest'} by providing related resources and activities`,
        growthAreas.length > 0
          ? `Gently encourage practice in ${growthAreas[0]} through fun, low-pressure activities`
          : 'Continue providing diverse learning opportunities',
        'Focus on effort and process rather than scores or comparisons',
        'Create a supportive environment where mistakes are seen as learning opportunities',
        'Engage in conversations about what your child enjoyed most in the assessments',
      ],
    },
    evidenceUsed: attempts.map(a => a.id),
    metadata: {
      demoGenerated: true,
      generationTime: 0, // Instant for demo
    },
  };

  // Save report to database
  const report = await db.aIReport.create({
    data: {
      studentId,
      tenantId,
      reportType: 'INITIAL_ASSESSMENT',
      studentInsights: reportData.studentInsights,
      parentGuidance: reportData.parentGuidance,
      evidenceUsed: reportData.evidenceUsed,
      metadata: reportData.metadata,
    },
  });

  return report.id;
}

