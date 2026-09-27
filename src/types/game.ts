export interface Point {
  x: number;
  y: number;
}

export type SkinPatternType =
  | 'solid'
  | 'stripes'
  | 'rainbow'
  | 'neon_glow'
  | 'bumblebee'
  | 'cosmic'
  | 'batik'
  | 'toxic';

export type AccessoryType =
  | 'none'
  | 'crown'
  | 'cowboy'
  | 'sunglasses'
  | 'party'
  | 'wizard'
  | 'devil'
  | 'halo'
  | 'viking';

export interface SkinConfig {
  id: string;
  name: string;
  pattern: SkinPatternType;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  accessory: AccessoryType;
  eyeType: 'cute' | 'fierce' | 'cool' | 'derp';
}

export interface Food {
  id: number;
  x: number;
  y: number;
  val: number;
  color: string;
  radius: number;
  isCorpseFood?: boolean;
}

export interface Worm {
  id: string;
  name: string;
  avatarUrl: string; // Player's face photo
  skin: SkinConfig;
  segments: Point[];
  angle: number;
  targetAngle: number;
  speed: number;
  isBoosting: boolean;
  score: number;
  length: number;
  thickness: number;
  isAlive: boolean;
  isBot: boolean;
  kills: number;
  deathTime?: number;
  foodEaten: number;
  color: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatarUrl: string;
  score: number;
  kills: number;
  rank: number;
  isCurrentPlayer: boolean;
  isBot: boolean;
}

export interface GameOverStats {
  score: number;
  length: number;
  kills: number;
  foodEaten: number;
  peakRank: number;
  finalRank: number;
  totalPlayers: number;
  survivalSeconds: number;
  deathReason: 'boundary' | 'crash' | 'other';
  killerName?: string;
  killerAvatar?: string;
}

export interface BestRecord {
  highScore: number;
  highestRank: number;
  maxKills: number;
  longestSurvival: number;
  totalGames: number;
}
