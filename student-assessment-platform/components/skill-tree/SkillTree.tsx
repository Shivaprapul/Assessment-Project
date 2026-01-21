/**
 * Skill Tree Visualization Component
 * 
 * Interactive tree visualization showing student's skill categories.
 * Matches UI/UX Design Spec with SVG-based tree layout.
 * 
 * @module components/skill-tree/SkillTree
 */

'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

interface SkillTreeCategory {
  category: string;
  name: string;
  score: number;
  level: string;
  icon: string;
  trend: string;
  evidence?: string[];
  history?: Array<{ date: string; score: number }>;
}

interface SkillTreeData {
  studentId: string;
  lastUpdated: string;
  categories: SkillTreeCategory[];
}

interface SkillTreeProps {
  data: SkillTreeData;
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

// Get trend variant for badge
const getTrendVariant = (trend: string): 'default' | 'secondary' | 'destructive' => {
  if (trend === 'improving') return 'default';
  if (trend === 'needs_attention') return 'destructive';
  return 'secondary';
};

// Get trend icon
const getTrendIcon = (trend: string) => {
  if (trend === 'improving') return <TrendingUp className="w-4 h-4" />;
  if (trend === 'needs_attention') return <TrendingDown className="w-4 h-4" />;
  return <Minus className="w-4 h-4" />;
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

export function SkillTree({ data }: SkillTreeProps) {
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
            <CardTitle>Your Skill Tree</CardTitle>
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
              const category = categories[index];
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
            {categories.map((category, index) => {
              const position = nodePositions[index];
              const color = getCategoryColor(category.category);
              const isHovered = hoveredNode?.category === category.category;

              return (
                <g
                  key={category.category}
                  transform={`translate(${position.x}, ${position.y})`}
                  onMouseEnter={(e) => handleNodeHover(category, e)}
                  onMouseLeave={handleNodeLeave}
                  className="cursor-pointer"
                >
                  {/* Outer glow on hover */}
                  {isHovered && (
                    <circle
                      r="50"
                      fill={color}
                      fillOpacity="0.1"
                      className="animate-pulse"
                    />
                  )}

                  {/* Node circle */}
                  <motion.circle
                    r="40"
                    fill={color}
                    fillOpacity="0.2"
                    stroke={color}
                    strokeWidth={isHovered ? "4" : "3"}
                    initial={{ scale: 1 }}
                    animate={{ scale: isHovered ? 1.1 : 1 }}
                    transition={{ duration: 0.2 }}
                  />

                  {/* Level icon */}
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

                  {/* Score */}
                  <text
                    textAnchor="middle"
                    y="85"
                    fontSize="10"
                    fill="#6b7280"
                    fontWeight="500"
                    className="pointer-events-none"
                  >
                    {category.score}/100
                  </text>
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

          {/* Tooltip */}
          {hoveredNode && (
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
                <span className="text-2xl">{hoveredNode.icon}</span>
                <h3 className="font-semibold text-sm">{hoveredNode.name}</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={getTrendVariant(hoveredNode.trend)}>
                    {getTrendIcon(hoveredNode.trend)}
                    <span className="ml-1 capitalize">{hoveredNode.trend}</span>
                  </Badge>
                  <span className="text-gray-600 capitalize">{hoveredNode.level}</span>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Score</span>
                    <span className="text-xs font-semibold">{hoveredNode.score}/100</span>
                  </div>
                  <Progress value={hoveredNode.score} className="h-2" />
                </div>
                {hoveredNode.evidence && hoveredNode.evidence.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Evidence:</p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      {hoveredNode.evidence.slice(0, 2).map((ev, idx) => (
                        <li key={idx}>• {ev}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

