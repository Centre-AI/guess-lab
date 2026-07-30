export type GuessResult = 'low' | 'high' | 'correct' | 'invalid' | 'lost'

export type RandomSource = () => number

export interface GuessingGameConfig {
  min: number
  max: number
  maxAttempts: number
  random?: RandomSource
}

export interface GuessOutcome {
  result: GuessResult
  attemptsRemaining: number
  /** Revealed only once the game has ended (result is 'correct' or 'lost'). */
  target?: number
}

/** Thrown when guess() is called after the game has already been won or lost. */
export class GameOverError extends Error {
  constructor() {
    super('The game is already complete. Call reset() to start a new game.')
    this.name = 'GameOverError'
  }
}

type GameStatus = 'in-progress' | 'won' | 'lost'

function assertValidConfig(config: GuessingGameConfig): void {
  const { min, max, maxAttempts, random } = config

  if (!Number.isInteger(min)) {
    throw new RangeError('min must be an integer.')
  }
  if (!Number.isInteger(max)) {
    throw new RangeError('max must be an integer.')
  }
  if (min > max) {
    throw new RangeError('min must be less than or equal to max.')
  }
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new RangeError('maxAttempts must be an integer greater than or equal to 1.')
  }
  if (random !== undefined && typeof random !== 'function') {
    throw new TypeError('random must be a function returning a number in [0, 1).')
  }
}

export class GuessingGame {
  min: number
  max: number
  maxAttempts: number

  private random: RandomSource
  private target: number
  private attemptsUsed: number
  private status: GameStatus

  constructor(config: GuessingGameConfig) {
    assertValidConfig(config)

    this.min = config.min
    this.max = config.max
    this.maxAttempts = config.maxAttempts
    this.random = config.random ?? Math.random

    this.target = this.generateTarget()
    this.attemptsUsed = 0
    this.status = 'in-progress'
  }

  get attemptsRemaining(): number {
    return this.maxAttempts - this.attemptsUsed
  }

  get isComplete(): boolean {
    return this.status !== 'in-progress'
  }

  guess(value: number): GuessOutcome {
    if (this.status !== 'in-progress') {
      throw new GameOverError()
    }

    if (!Number.isInteger(value) || value < this.min || value > this.max) {
      return { result: 'invalid', attemptsRemaining: this.attemptsRemaining }
    }

    this.attemptsUsed += 1

    if (value === this.target) {
      this.status = 'won'
      return { result: 'correct', attemptsRemaining: this.attemptsRemaining, target: this.target }
    }

    if (this.attemptsRemaining <= 0) {
      this.status = 'lost'
      return { result: 'lost', attemptsRemaining: 0, target: this.target }
    }

    return {
      result: value < this.target ? 'low' : 'high',
      attemptsRemaining: this.attemptsRemaining,
    }
  }

  /** Starts a new game, optionally overriding the original configuration. */
  reset(overrides?: Partial<GuessingGameConfig>): void {
    const config: GuessingGameConfig = {
      min: this.min,
      max: this.max,
      maxAttempts: this.maxAttempts,
      random: this.random,
      ...overrides,
    }
    assertValidConfig(config)

    this.min = config.min
    this.max = config.max
    this.maxAttempts = config.maxAttempts
    this.random = config.random ?? Math.random
    this.target = this.generateTarget()
    this.attemptsUsed = 0
    this.status = 'in-progress'
  }

  private generateTarget(): number {
    const range = this.max - this.min + 1
    return this.min + Math.floor(this.random() * range)
  }
}
