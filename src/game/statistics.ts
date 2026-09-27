import { DIFFICULTIES, type Difficulty } from './config'

export interface Statistics {
  wins: number
  losses: number
  currentStreak: number
  bestAttemptsByDifficulty: Record<Difficulty, number | null>
}

const STORAGE_KEY = 'guess-lab:statistics:v1'

export function createDefaultStatistics(): Statistics {
  return {
    wins: 0,
    losses: 0,
    currentStreak: 0,
    bestAttemptsByDifficulty: {
      easy: null,
      normal: null,
      hard: null,
    },
  }
}

function isPositiveIntegerOrNull(value: unknown): value is number | null {
  return value === null || (Number.isInteger(value) && (value as number) > 0)
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0
}

function isValidStatistics(value: unknown): value is Statistics {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  if (
    !isNonNegativeInteger(candidate.wins) ||
    !isNonNegativeInteger(candidate.losses) ||
    !isNonNegativeInteger(candidate.currentStreak)
  ) {
    return false
  }

  const best = candidate.bestAttemptsByDifficulty
  if (typeof best !== 'object' || best === null) {
    return false
  }
  const bestRecord = best as Record<string, unknown>

  return DIFFICULTIES.every((difficulty) => isPositiveIntegerOrNull(bestRecord[difficulty]))
}

/** Reads persisted statistics, falling back to defaults if the entry is missing, corrupt or from an incompatible schema. */
export function loadStatistics(storage: Storage = window.localStorage): Statistics {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw === null) {
      return createDefaultStatistics()
    }

    const parsed: unknown = JSON.parse(raw)
    return isValidStatistics(parsed) ? parsed : createDefaultStatistics()
  } catch {
    return createDefaultStatistics()
  }
}

export function saveStatistics(statistics: Statistics, storage: Storage = window.localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(statistics))
  } catch {
    // Storage may be unavailable (quota exceeded, private browsing, disabled). Statistics
    // simply won't persist for this session; the game remains playable.
  }
}

export function recordWin(statistics: Statistics, difficulty: Difficulty, attemptsUsed: number): Statistics {
  const previousBest = statistics.bestAttemptsByDifficulty[difficulty]
  const bestAttempts = previousBest === null ? attemptsUsed : Math.min(previousBest, attemptsUsed)

  return {
    wins: statistics.wins + 1,
    losses: statistics.losses,
    currentStreak: statistics.currentStreak + 1,
    bestAttemptsByDifficulty: {
      ...statistics.bestAttemptsByDifficulty,
      [difficulty]: bestAttempts,
    },
  }
}

export function recordLoss(statistics: Statistics): Statistics {
  return {
    ...statistics,
    losses: statistics.losses + 1,
    currentStreak: 0,
  }
}
