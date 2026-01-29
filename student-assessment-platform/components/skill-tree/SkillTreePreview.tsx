/**
 * Skill Tree Preview Component
 * 
 * Compact preview of skill tree for dashboard.
 * Shows top 3 categories with quick stats.
 * 
 * @module components/skill-tree/SkillTreePreview
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SkillTreeCategory {
  category: string;
  name: string;
  score: number;
  level: string; // Legacy field
  icon: string;
  trend: string;
  evidence?: string[];
  // New fields for student game-like display
  skillLevel?: number; // 1-10
  levelTitle?: string; // "Seedling", "Sprout", etc.
  skillXP?: number; // XP value
  currentMaturityBand?: string; // Internal only, not displayed
}

interface SkillTreePreviewProps {
  categories: SkillTreeCategory[];
  onViewFull?: () => void;
}

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    COGNITIVE_REASONING: '#3b82f6',
    CREATIVITY: '#a855f7',
    LANGUAGE: '#06b6d4',
    MEMORY: '#ec4899',
    ATTENTION: '#f59e0b',
    PLANNING: '#10b981',
    SOCIAL_EMOTIONAL: '#f97316',
    METACOGNITION: '#8b5cf6',
    CHARACTER_VALUES: '#14b8a6',
  };
  return colors[category] || '#6b7280';
};

const getTrendIcon = (trend: string) => {
  if (trend === 'improving') return <TrendingUp className="w-4 h-4" />;
  if (trend === 'needs_attention') return <TrendingDown className="w-4 h-4" />;
  return <Minus className="w-4 h-4" />;
};

const getTrendVariant = (trend: string): 'default' | 'secondary' | 'destructive' => {
  if (trend === 'improving') return 'default';
  if (trend === 'needs_attention') return 'destructive';
  return 'secondary';
};

export function SkillTreePreview({ categories, onViewFull }: SkillTreePreviewProps) {
  const router = useRouter();

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg mb-2">🌳</p>
        <p>Complete your initial assessment to see your Skill Tree</p>
        <Button className="mt-4" onClick={() => router.push('/assessments')}>
          Start Assessment
        </Button>
      </div>
    );
  }

  // Sort by score (highest first) and take top 3
  const topCategories = [...categories]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const handleViewFull = () => {
    if (onViewFull) {
      onViewFull();
    } else {
      router.push('/skill-tree');
    }
  };

  return (
    <div className="space-y-4">
      {topCategories.map((category) => {
        const color = getCategoryColor(category.category);
        return (
          <div
            key={category.category}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                style={{
                  backgroundColor: `${color}20`,
                  border: `2px solid ${color}`,
                }}
              >
                {category.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{category.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getTrendVariant(category.trend)} className="text-xs">
                    {getTrendIcon(category.trend)}
                    <span className="ml-1 capitalize">{category.trend}</span>
                  </Badge>
                  {/* Show game-like level for students (never show maturity band labels) */}
                  {category.skillLevel && category.levelTitle ? (
                    <span className="text-xs text-gray-600 font-medium">
                      Level {category.skillLevel} • {category.levelTitle}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-600 capitalize">{category.level}</span>
                  )}
                </div>
                <div className="mt-2">
                  <Progress value={category.score} className="h-2" />
                </div>
                {/* Show XP if available */}
                {category.skillXP !== undefined && (
                  <div className="mt-1 text-xs text-gray-500">
                    {category.skillXP} XP
                  </div>
                )}
              </div>
            </div>
            <div className="text-right ml-4">
              <div className="text-2xl font-bold" style={{ color }}>
                {category.score}
              </div>
              <div className="text-xs text-gray-500">/100</div>
            </div>
          </div>
        );
      })}

      {categories.length > 3 && (
        <div className="pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={handleViewFull}
          >
            View All {categories.length} Skills
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

