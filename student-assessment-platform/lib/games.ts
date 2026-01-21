/**
 * Assessment Games Configuration
 * 
 * Defines the 8 preliminary assessment games and their metadata.
 * 
 * @module lib/games
 */

export interface GameConfig {
  id: string;
  name: string;
  description: string;
  estimatedTime: number; // minutes
  difficulty: number; // 1-5
  orderIndex: number;
  targetCategories: string[];
  thumbnail?: string;
}

export const ASSESSMENT_GAMES: GameConfig[] = [
  {
    id: 'pattern_forge',
    name: 'Pattern Forge',
    description: 'Discover your logical reasoning abilities through pattern recognition',
    estimatedTime: 10,
    difficulty: 2,
    orderIndex: 1,
    targetCategories: ['COGNITIVE_REASONING'],
  },
  {
    id: 'many_ways_builder',
    name: 'Many Ways Builder',
    description: 'Explore your creativity by finding multiple solutions',
    estimatedTime: 12,
    difficulty: 2,
    orderIndex: 2,
    targetCategories: ['CREATIVITY'],
  },
  {
    id: 'story_lens',
    name: 'Story Lens',
    description: 'Express yourself through storytelling and narrative thinking',
    estimatedTime: 15,
    difficulty: 2,
    orderIndex: 3,
    targetCategories: ['LANGUAGE', 'CREATIVITY'],
  },
  {
    id: 'visual_vault',
    name: 'Visual Vault',
    description: 'Test your visual memory and spatial reasoning',
    estimatedTime: 10,
    difficulty: 2,
    orderIndex: 4,
    targetCategories: ['MEMORY'],
  },
  {
    id: 'focus_sprint',
    name: 'Focus Sprint',
    description: 'Measure your attention and concentration abilities',
    estimatedTime: 8,
    difficulty: 2,
    orderIndex: 5,
    targetCategories: ['ATTENTION'],
  },
  {
    id: 'mission_planner',
    name: 'Mission Planner',
    description: 'Demonstrate your planning and organizational skills',
    estimatedTime: 12,
    difficulty: 2,
    orderIndex: 6,
    targetCategories: ['PLANNING'],
  },
  {
    id: 'dilemma_compass',
    name: 'Dilemma Compass',
    description: 'Navigate ethical decisions and show your values',
    estimatedTime: 15,
    difficulty: 3,
    orderIndex: 7,
    targetCategories: ['SOCIAL_EMOTIONAL', 'CHARACTER_VALUES'],
  },
  {
    id: 'replay_reflect',
    name: 'Replay & Reflect',
    description: 'Reflect on your learning and metacognitive awareness',
    estimatedTime: 10,
    difficulty: 2,
    orderIndex: 8,
    targetCategories: ['METACOGNITION'],
  },
];

/**
 * Get game configuration by ID
 */
export function getGameConfig(gameId: string): GameConfig | undefined {
  return ASSESSMENT_GAMES.find(game => game.id === gameId);
}

/**
 * Get all games in order
 */
export function getAllGames(): GameConfig[] {
  return ASSESSMENT_GAMES.sort((a, b) => a.orderIndex - b.orderIndex);
}

