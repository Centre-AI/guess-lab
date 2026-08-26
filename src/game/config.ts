import type { GuessingGameConfig } from './guessingGame'

export type Difficulty = 'easy' | 'normal' | 'hard'

export type DifficultyConfig = Omit<GuessingGameConfig, 'random'>

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: { min: 1, max: 50, maxAttempts: 7 },
  normal: { min: 1, max: 100, maxAttempts: 8 },
  hard: { min: 1, max: 500, maxAttempts: 10 },
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
}

export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard']

export const DEFAULT_DIFFICULTY: Difficulty = 'normal'
