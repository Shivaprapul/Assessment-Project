/**
 * Skill Tree Component with Maturity Band Integration
 * 
 * Role-based Skill Tree that:
 * - Shows game-like levels for students (never maturity bands)
 * - Adds grade context for parents
 * - Shows actionable insights for teachers
 * 
 * @module components/skill-tree/SkillTreeWithMaturity
 */

'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Sparkles, Star, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  getSkillTreeDisplayProps,
  type SkillTreeDisplayProps,
} from '@/lib/skill-tree-display';
import { SkillMaturityBand } from '@/lib/skill-maturity-bands';
import { getExpectedBandForGradeSkill } from '@/lib/grade-skill-expectations';
import { getCurrentSkillBand } from '@/lib/skill-expectation-helpers';
import type { Grade } from '@/lib/grade-utils';
import { SkillCategory } from '@prisma/client';

interface SkillTreeCategory {
  category: SkillCategory;
  name: string;
  score: number;
  level: string; // Legacy - will be replaced
  icon: string;
  trend: string;
  evidence?: string[];
  history?: Array<{ date: string; score: number }>;
  // New fields for maturity band system
  currentMaturityBand?: SkillMaturityBand;
  skillXP?: number;
  skillLevel?: number; // 1-10
}

interface SkillTreeData {
  studentId: string;
  lastUpdated: string;
  categories: SkillTreeCategory[];
  // Role and grade context
  role?: 'student' | 'parent' | 'teacher';
  currentGrade?: Grade;
}

interface SkillTreeWithMaturityProps {
  data: SkillTreeData;
  role?: 'student' | 'parent' | 'teacher';
  currentGrade?: Grade;
}

// Category colors from design spec
const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    COGNITIVE_REASONING: '#3b82f6', // Blue
    CREATIVITY: '#a855f7', // Purple
    LANGUAGE: '#06b6d4', // Cyan
    MEMORY: '#ec4899', // Pink
    ATTENTION: '#f59e0b', // Amber
    PLANNING: '#10b981', // Green
    SOCIAL_EMOTIONAL: '#f97316', // Orange
    METACOGNITION: '#8b5cf6', // Violet
    CHARACTER_VALUES: '#14b8a6', // Teal
  };
  return colors[category] || '#6b7280';
};

// Get visual style based on maturity band cues
const getVisualStyle = (cues: SkillTreeDisplayProps['visualCues'], color: string) => {
  const baseStyle: React.CSSProperties = {
    borderColor: color,
  };
  
  switch (cues.glow) {
    case 'soft':
      return { ...baseStyle, boxShadow: `0 0 8px ${color}40` };
    case 'solid':
      return { ...baseStyle, boxShadow: `0 0 12px ${color}60` };
    case 'steady':
      return { ...baseStyle, boxShadow: `0 0 16px ${color}80`, animation: 'pulse 2s infinite' };
    case 'highlight':
      return { ...baseStyle, boxShadow: `0 0 20px ${color}`, borderWidth: '3px' };
    case 'aura':
      return { ...baseStyle, boxShadow: `0 0 24px ${color}`, borderWidth: '4px', animation: 'glow 2s infinite' };
    default:
      return baseStyle;
  }
};

// Calculate node positions in a circular/tree layout
const calculateNodePositions = (count: number, centerX: number, centerY: number, radius: number) => {
  const positions: Array<{ x: number; y: number }> = [];
  const angleStep = (2 * Math.PI) / count;

  for (let i = 0; i < count; i++) {
    const angle = i * angleStep - Math.PI / 2; // Start from top
    positions.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  }

  return positions;
};

export function SkillTreeWithMaturity({ data, role = 'student', currentGrade }: SkillTreeWithMaturityProps) {
  const [hoveredNode, setHoveredNode] = useState<SkillTreeCategory | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const { categories } = data;
  const centerX = 400;
  const centerY = 300;
  const radius = 200;

  const nodePositions = useMemo(
    () => calculateNodePositions(categories.length, centerX, centerY, radius),
    [categories.length]
  );

  // Get display props for each category (with maturity band integration)
  const categoriesWithDisplay = useMemo(() => {
    return categories.map((category) => {
      // Get current maturity band (from category or calculate)
      const currentBand = category.currentMaturityBand || SkillMaturityBand.UNCLASSIFIED;
      
      // Get expected band for grade
      const expectedBand = currentGrade 
        ? getExpectedBandForGradeSkill(currentGrade, category.category)
        : null;
      
      // Convert trend string to expected format
      const trend = category.trend === 'improving' ? 'up' : 
                    category.trend === 'needs_attention' ? 'down' : 'stable';
      
      // Get display props based on role
      const displayProps = getSkillTreeDisplayProps(
        role,
        currentBand,
        category.score,
        trend,
        category.category,
        category.name,
        currentGrade,
        expectedBand
      );
      
      return {
        ...category,
        displayProps,
        // Override level and XP from display props
        skillLevel: displayProps.level,
        skillXP: displayProps.xp,
      };
    });
  }, [categories, role, currentGrade]);

  const handleNodeHover = (category: SkillTreeCategory, event: React.MouseEvent<SVGGElement>) => {
    setHoveredNode(category);
    const rect = (event.currentTarget as SVGGElement).getBoundingClientRect();
    const svg = (event.currentTarget as SVGGElement).closest('svg');
    if (svg) {
      const svgRect = svg.getBoundingClientRect();
      setTooltipPosition({ 
        x: rect.left - svgRect.left + rect.width / 2, 
        y: rect.top - svgRect.top 
      });
    }
  };

  const handleNodeLeave = () => {
    setHoveredNode(null);
  };

  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Skill Tree</CardTitle>
          <CardDescription>Complete your assessment to see your skills</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-4">🌳</p>
            <p>No skill data available yet</p>
            <p className="text-sm mt-2">Complete your initial assessment to build your Skill Tree</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {role === 'student' ? 'Your Skill Tree' : 
               role === 'parent' ? 'Skill Overview' : 
               'Class Skill Tree'}
            </CardTitle>
            <CardDescription>
              Last updated: {new Date(data.lastUpdated).toLocaleDateString()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-[600px] overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 800 600">
            {/* Connection lines from center to nodes */}
            {nodePositions.map((pos, index) => {
              const category = categoriesWithDisplay[index];
              const color = getCategoryColor(category.category);
              return (
                <line
                  key={`line-${category.category}`}
                  x1={centerX}
                  y1={centerY}
                  x2={pos.x}
                  y2={pos.y}
                  stroke={color}
                  strokeWidth="2"
                  strokeOpacity="0.3"
                />
              );
            })}

            {/* Skill nodes */}
            {categoriesWithDisplay.map((category, index) => {
              const position = nodePositions[index];
              const color = getCategoryColor(category.category);
              const isHovered = hoveredNode?.category === category.category;
              const displayProps = category.displayProps;
              const visualStyle = getVisualStyle(displayProps.visualCues, color);

              return (
                <g
                  key={category.category}
                  transform={`translate(${position.x}, ${position.y})`}
                  onMouseEnter={(e) => handleNodeHover(category, e)}
                  onMouseLeave={handleNodeLeave}
                  className="cursor-pointer"
                >
                  {/* Visual progression cues based on maturity band */}
                  {displayProps.visualCues.glow === 'aura' && (
                    <circle
                      r="55"
                      fill={color}
                      fillOpacity="0.05"
                      className="animate-pulse"
                    />
                  )}
                  
                  {/* Outer glow on hover */}
                  {isHovered && (
                    <circle
                      r="50"
                      fill={color}
                      fillOpacity="0.1"
                      className="animate-pulse"
                    />
                  )}

                  {/* Node circle with visual cues */}
                  <motion.circle
                    r="40"
                    fill={color}
                    fillOpacity="0.2"
                    stroke={color}
                    strokeWidth={displayProps.visualCues.glow === 'highlight' || displayProps.visualCues.glow === 'aura' ? "4" : isHovered ? "4" : "3"}
                    initial={{ scale: 1 }}
                    animate={{ scale: isHovered ? 1.1 : 1 }}
                    transition={{ duration: 0.2 }}
                    style={visualStyle}
                  />

                  {/* Level icon or badge indicator */}
                  {displayProps.visualCues.progressStyle === 'badge' && (
                    <circle
                      r="12"
                      fill="#fbbf24"
                      cx="-25"
                      cy="-25"
                      className="animate-pulse"
                    />
                  )}
                  
                  {displayProps.visualCues.progressStyle === 'star' && (
                    <g transform="translate(-25, -25)">
                      <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                    </g>
                  )}

                  {/* Skill icon */}
                  <text
                    textAnchor="middle"
                    dy=".3em"
                    fontSize="24"
                    className="pointer-events-none"
                  >
                    {category.icon}
                  </text>

                  {/* Category label */}
                  <text
                    textAnchor="middle"
                    y="55"
                    fontSize="11"
                    fill="#374151"
                    fontWeight="600"
                    className="pointer-events-none"
                  >
                    {category.name.split(' ')[0]}
                  </text>
                  {category.name.split(' ').length > 1 && (
                    <text
                      textAnchor="middle"
                      y="68"
                      fontSize="11"
                      fill="#374151"
                      fontWeight="600"
                      className="pointer-events-none"
                    >
                      {category.name.split(' ').slice(1).join(' ')}
                    </text>
                  )}

                  {/* Level (student view) or maturity band (teacher view) */}
                  {role === 'student' ? (
                    <text
                      textAnchor="middle"
                      y="85"
                      fontSize="10"
                      fill="#6b7280"
                      fontWeight="500"
                      className="pointer-events-none"
                    >
                      Lv {displayProps.level} • {displayProps.levelTitle}
                    </text>
                  ) : role === 'teacher' ? (
                    <text
                      textAnchor="middle"
                      y="85"
                      fontSize="10"
                      fill="#6b7280"
                      fontWeight="500"
                      className="pointer-events-none"
                    >
                      {category.currentMaturityBand || 'Unclassified'}
                    </text>
                  ) : (
                    <text
                      textAnchor="middle"
                      y="85"
                      fontSize="10"
                      fill="#6b7280"
                      fontWeight="500"
                      className="pointer-events-none"
                    >
                      Level {displayProps.level}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Center node (student) */}
            <g transform={`translate(${centerX}, ${centerY})`}>
              <circle
                r="30"
                fill="#3b82f6"
                fillOpacity="0.1"
                stroke="#3b82f6"
                strokeWidth="3"
              />
              <text
                textAnchor="middle"
                dy=".3em"
                fontSize="20"
                fill="#3b82f6"
                fontWeight="bold"
              >
                👤
              </text>
            </g>
          </svg>

          {/* Tooltip - role-based content */}
          {hoveredNode && (() => {
            const category = categoriesWithDisplay.find(c => c.category === hoveredNode.category);
            if (!category) return null;
            
            const displayProps = category.displayProps;
            const color = getCategoryColor(category.category);
            
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-10 max-w-xs pointer-events-none"
                style={{
                  left: `${tooltipPosition.x}px`,
                  top: `${tooltipPosition.y - 10}px`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{category.icon}</span>
                  <h3 className="font-semibold text-sm">{category.name}</h3>
                </div>
                
                {/* Student View - Game-like */}
                {role === 'student' && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Level {displayProps.level}
                      </Badge>
                      <span className="text-xs text-gray-600 font-semibold">{displayProps.levelTitle}</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">XP</span>
                        <span className="text-xs font-semibold">{displayProps.xp}</span>
                      </div>
                      <Progress value={displayProps.xpProgress} className="h-2" />
                    </div>
                    <p className="text-xs text-blue-600 font-medium mt-2">
                      {displayProps.studentCopy}
                    </p>
                    {category.trend === 'improving' && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <TrendingUp className="w-3 h-3" />
                        <span>Trending ↑</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Parent View - With Context */}
                {role === 'parent' && displayProps.parentContext && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Level {displayProps.level}</span>
                      {displayProps.parentContext.indicators.map((ind, idx) => (
                        <span key={idx} className="text-xs">{ind}</span>
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Score</span>
                        <span className="text-xs font-semibold">{category.score}/100</span>
                      </div>
                      <Progress value={category.score} className="h-2" />
                    </div>
                    <p className="text-xs text-gray-700 mt-2 leading-relaxed">
                      {displayProps.parentContext.message}
                    </p>
                  </div>
                )}
                
                {/* Teacher View - Actionable Insights */}
                {role === 'teacher' && displayProps.teacherInsights && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {displayProps.teacherInsights.maturityBand}
                      </Badge>
                      <span className="text-xs text-gray-600">Level {displayProps.level}</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Score</span>
                        <span className="text-xs font-semibold">{category.score}/100</span>
                      </div>
                      <Progress value={category.score} className="h-2" />
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-1">Suggested Actions:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {displayProps.teacherInsights.suggestedActions.slice(0, 2).map((action, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}

