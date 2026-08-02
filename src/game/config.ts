import type { GuessingGameConfig } from './guessingGame'

export const GAME_CONFIG: Omit<GuessingGameConfig, 'random'> = {
  min: 1,
  max: 100,
  maxAttempts: 7,
}
