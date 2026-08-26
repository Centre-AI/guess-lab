import { describe, expect, it } from 'vitest'
import { DEFAULT_DIFFICULTY, DIFFICULTIES, DIFFICULTY_CONFIGS, DIFFICULTY_LABELS } from './config'

describe('difficulty configs', () => {
  it('defines easy as numbers 1-50 with 7 attempts', () => {
    expect(DIFFICULTY_CONFIGS.easy).toEqual({ min: 1, max: 50, maxAttempts: 7 })
  })

  it('defines normal as numbers 1-100 with 8 attempts', () => {
    expect(DIFFICULTY_CONFIGS.normal).toEqual({ min: 1, max: 100, maxAttempts: 8 })
  })

  it('defines hard as numbers 1-500 with 10 attempts', () => {
    expect(DIFFICULTY_CONFIGS.hard).toEqual({ min: 1, max: 500, maxAttempts: 10 })
  })

  it('defaults to normal difficulty', () => {
    expect(DEFAULT_DIFFICULTY).toBe('normal')
  })

  it('lists all three difficulties with labels', () => {
    expect(DIFFICULTIES).toEqual(['easy', 'normal', 'hard'])
    expect(DIFFICULTY_LABELS).toEqual({ easy: 'Easy', normal: 'Normal', hard: 'Hard' })
  })
})
