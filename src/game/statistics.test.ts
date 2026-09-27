import { beforeEach, describe, expect, it } from 'vitest'
import {
  createDefaultStatistics,
  loadStatistics,
  recordLoss,
  recordWin,
  saveStatistics,
  type Statistics,
} from './statistics'

const STORAGE_KEY = 'guess-lab:statistics:v1'

beforeEach(() => {
  window.localStorage.clear()
})

describe('createDefaultStatistics', () => {
  it('starts with zeroed wins, losses and streak, and no recorded best attempts', () => {
    expect(createDefaultStatistics()).toEqual({
      wins: 0,
      losses: 0,
      currentStreak: 0,
      bestAttemptsByDifficulty: { easy: null, normal: null, hard: null },
    })
  })
})

describe('recordWin', () => {
  it('increments wins and the current streak', () => {
    const next = recordWin(createDefaultStatistics(), 'normal', 4)

    expect(next.wins).toBe(1)
    expect(next.currentStreak).toBe(1)
    expect(next.losses).toBe(0)
  })

  it('records the first winning attempt count as the best for that difficulty', () => {
    const next = recordWin(createDefaultStatistics(), 'hard', 6)

    expect(next.bestAttemptsByDifficulty.hard).toBe(6)
  })

  it('keeps the lower attempt count as the best', () => {
    const first = recordWin(createDefaultStatistics(), 'easy', 5)
    const second = recordWin(first, 'easy', 3)
    const third = recordWin(second, 'easy', 7)

    expect(third.bestAttemptsByDifficulty.easy).toBe(3)
  })

  it('tracks best attempts independently per difficulty', () => {
    const afterEasy = recordWin(createDefaultStatistics(), 'easy', 4)
    const afterHard = recordWin(afterEasy, 'hard', 9)

    expect(afterHard.bestAttemptsByDifficulty).toEqual({ easy: 4, normal: null, hard: 9 })
  })

  it('continues an existing streak across difficulties', () => {
    const afterEasy = recordWin(createDefaultStatistics(), 'easy', 4)
    const afterNormal = recordWin(afterEasy, 'normal', 5)

    expect(afterNormal.currentStreak).toBe(2)
  })
})

describe('recordLoss', () => {
  it('increments losses and resets the current streak', () => {
    const won = recordWin(createDefaultStatistics(), 'normal', 3)
    const lost = recordLoss(won)

    expect(lost.losses).toBe(1)
    expect(lost.wins).toBe(1)
    expect(lost.currentStreak).toBe(0)
  })

  it('does not affect recorded best attempts', () => {
    const won = recordWin(createDefaultStatistics(), 'normal', 3)
    const lost = recordLoss(won)

    expect(lost.bestAttemptsByDifficulty.normal).toBe(3)
  })
})

describe('loadStatistics / saveStatistics', () => {
  it('returns defaults when nothing has been saved yet', () => {
    expect(loadStatistics()).toEqual(createDefaultStatistics())
  })

  it('round-trips saved statistics through localStorage', () => {
    const statistics = recordWin(createDefaultStatistics(), 'normal', 4)
    saveStatistics(statistics)

    expect(loadStatistics()).toEqual(statistics)
  })

  it('recovers with defaults when the stored value is not valid JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json')

    expect(loadStatistics()).toEqual(createDefaultStatistics())
  })

  it('recovers with defaults when the stored value has an incompatible shape', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ totallyDifferent: true }))

    expect(loadStatistics()).toEqual(createDefaultStatistics())
  })

  it('recovers with defaults when fields have the wrong types', () => {
    const corrupt = {
      wins: 'three',
      losses: 0,
      currentStreak: 0,
      bestAttemptsByDifficulty: { easy: null, normal: null, hard: null },
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(corrupt))

    expect(loadStatistics()).toEqual(createDefaultStatistics())
  })

  it('recovers with defaults when getItem throws (storage disabled)', () => {
    const throwingStorage: Storage = {
      ...window.localStorage,
      getItem() {
        throw new Error('storage disabled')
      },
    }

    expect(loadStatistics(throwingStorage)).toEqual(createDefaultStatistics())
  })

  it('silently ignores write failures', () => {
    const throwingStorage: Storage = {
      ...window.localStorage,
      setItem() {
        throw new Error('quota exceeded')
      },
    }

    expect(() => saveStatistics(createDefaultStatistics(), throwingStorage)).not.toThrow()
  })

  it('accepts a custom storage implementation', () => {
    const entries = new Map<string, string>()
    const customStorage: Storage = {
      length: 0,
      clear: () => entries.clear(),
      key: () => null,
      getItem: (key) => entries.get(key) ?? null,
      setItem: (key, value) => {
        entries.set(key, value)
      },
      removeItem: (key) => {
        entries.delete(key)
      },
    }

    const statistics: Statistics = recordWin(createDefaultStatistics(), 'hard', 2)
    saveStatistics(statistics, customStorage)

    expect(loadStatistics(customStorage)).toEqual(statistics)
  })
})
