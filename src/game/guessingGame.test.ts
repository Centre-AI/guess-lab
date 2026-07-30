import { describe, expect, it } from 'vitest'
import { GameOverError, GuessingGame, type RandomSource } from './guessingGame'

/** Deterministic RNG: returns a fixed sequence of [0, 1) values, repeating the last one. */
function fixedRandom(...values: number[]): RandomSource {
  let index = 0
  return () => {
    const value = values[Math.min(index, values.length - 1)]
    index += 1
    return value
  }
}

describe('GuessingGame construction', () => {
  it('receives a minimum, maximum and attempt limit', () => {
    const game = new GuessingGame({ min: 1, max: 10, maxAttempts: 5 })

    expect(game.min).toBe(1)
    expect(game.max).toBe(10)
    expect(game.maxAttempts).toBe(5)
    expect(game.attemptsRemaining).toBe(5)
    expect(game.isComplete).toBe(false)
  })

  it('rejects a non-integer min', () => {
    expect(() => new GuessingGame({ min: 1.5, max: 10, maxAttempts: 5 })).toThrow(RangeError)
  })

  it('rejects a non-integer max', () => {
    expect(() => new GuessingGame({ min: 1, max: 10.5, maxAttempts: 5 })).toThrow(RangeError)
  })

  it('rejects a min greater than max', () => {
    expect(() => new GuessingGame({ min: 10, max: 1, maxAttempts: 5 })).toThrow(RangeError)
  })

  it('rejects an attempt limit below 1', () => {
    expect(() => new GuessingGame({ min: 1, max: 10, maxAttempts: 0 })).toThrow(RangeError)
  })

  it('rejects a non-integer attempt limit', () => {
    expect(() => new GuessingGame({ min: 1, max: 10, maxAttempts: 2.5 })).toThrow(RangeError)
  })
})

describe('target generation', () => {
  it('always falls inside the configured range for the lowest possible random draw', () => {
    const game = new GuessingGame({ min: 1, max: 10, maxAttempts: 1, random: fixedRandom(0) })

    expect(game.guess(1).result).toBe('correct')
  })

  it('always falls inside the configured range for the highest possible random draw', () => {
    const game = new GuessingGame({
      min: 1,
      max: 10,
      maxAttempts: 1,
      random: fixedRandom(0.999999999),
    })

    expect(game.guess(10).result).toBe('correct')
  })

  it('stays within range across many random draws', () => {
    const min = 5
    const max = 15
    const attempts = max - min + 1

    for (let i = 0; i < 100; i += 1) {
      const draw = i / 100
      const game = new GuessingGame({ min, max, maxAttempts: attempts, random: fixedRandom(draw) })

      let sawCorrect = false
      for (let guess = min; guess <= max; guess += 1) {
        if (game.guess(guess).result === 'correct') {
          sawCorrect = true
          break
        }
      }

      expect(sawCorrect).toBe(true)
    }
  })

  it('injected random source produces a deterministic target', () => {
    const first = new GuessingGame({ min: 1, max: 100, maxAttempts: 1, random: fixedRandom(0.42) })
    const second = new GuessingGame({ min: 1, max: 100, maxAttempts: 1, random: fixedRandom(0.42) })

    const firstOutcome = first.guess(43)
    const secondOutcome = second.guess(43)

    expect(firstOutcome.result).toBe('correct')
    expect(secondOutcome.result).toBe('correct')
  })
})

describe('guess results', () => {
  it('reports low when the guess is below the target', () => {
    const game = new GuessingGame({ min: 1, max: 10, maxAttempts: 5, random: fixedRandom(0.5) })
    // random 0.5 over range 10 -> min + floor(5) = 6
    expect(game.guess(3).result).toBe('low')
  })

  it('reports high when the guess is above the target', () => {
    const game = new GuessingGame({ min: 1, max: 10, maxAttempts: 5, random: fixedRandom(0.5) })
    expect(game.guess(9).result).toBe('high')
  })

  it('reports correct and reveals the target when the guess matches', () => {
    const game = new GuessingGame({ min: 1, max: 10, maxAttempts: 5, random: fixedRandom(0.5) })
    const outcome = game.guess(6)

    expect(outcome.result).toBe('correct')
    expect(outcome.target).toBe(6)
    expect(game.isComplete).toBe(true)
  })

  it('reports lost once the attempt limit is exhausted without a correct guess', () => {
    const game = new GuessingGame({ min: 1, max: 10, maxAttempts: 2, random: fixedRandom(0.5) })

    expect(game.guess(1).result).toBe('low')
    const final = game.guess(2)

    expect(final.result).toBe('lost')
    expect(final.target).toBe(6)
    expect(final.attemptsRemaining).toBe(0)
    expect(game.isComplete).toBe(true)
  })

  it('reports correct instead of lost when the final attempt is right', () => {
    const game = new GuessingGame({ min: 1, max: 10, maxAttempts: 2, random: fixedRandom(0.5) })

    expect(game.guess(1).result).toBe('low')
    const final = game.guess(6)

    expect(final.result).toBe('correct')
    expect(game.isComplete).toBe(true)
  })
})

describe('boundaries', () => {
  it('accepts a guess equal to min', () => {
    const game = new GuessingGame({ min: 1, max: 10, maxAttempts: 5, random: fixedRandom(0.5) })
    expect(game.guess(1).result).toBe('low')
  })

  it('accepts a guess equal to max', () => {
    const game = new GuessingGame({ min: 1, max: 10, maxAttempts: 5, random: fixedRandom(0.5) })
    expect(game.guess(10).result).toBe('high')
  })

  it('treats one below min as invalid', () => {
    const game = new GuessingGame({ min: 1, max: 10, maxAttempts: 5 })
    expect(game.guess(0).result).toBe('invalid')
  })

  it('treats one above max as invalid', () => {
    const game = new GuessingGame({ min: 1, max: 10, maxAttempts: 5 })
    expect(game.guess(11).result).toBe('invalid')
  })

  it('supports a single-value range', () => {
    const game = new GuessingGame({ min: 7, max: 7, maxAttempts: 1, random: fixedRandom(0) })
    expect(game.guess(7).result).toBe('correct')
  })
})

describe('invalid guesses', () => {
  it('rejects non-integer guesses without consuming an attempt', () => {
    const game = new GuessingGame({ min: 1, max: 10, maxAttempts: 3 })

    const outcome = game.guess(3.5)

    expect(outcome.result).toBe('invalid')
    expect(game.attemptsRemaining).toBe(3)
  })

  it('rejects NaN guesses without consuming an attempt', () => {
    const game = new GuessingGame({ min: 1, max: 10, maxAttempts: 3 })

    const outcome = game.guess(Number.NaN)

    expect(outcome.result).toBe('invalid')
    expect(game.attemptsRemaining).toBe(3)
  })

  it('rejects out-of-range guesses without consuming an attempt', () => {
    const game = new GuessingGame({ min: 1, max: 10, maxAttempts: 3 })

    game.guess(-5)
    game.guess(100)

    expect(game.attemptsRemaining).toBe(3)
  })

  it('consumes an attempt only for in-range integer guesses', () => {
    const game = new GuessingGame({ min: 1, max: 10, maxAttempts: 3, random: fixedRandom(0.5) })

    game.guess(1) // low, consumes an attempt
    expect(game.attemptsRemaining).toBe(2)

    game.guess(99) // invalid, does not consume an attempt
    expect(game.attemptsRemaining).toBe(2)
  })
})

describe('completed game', () => {
  it('rejects further guesses after a win until reset', () => {
    const game = new GuessingGame({ min: 1, max: 10, maxAttempts: 5, random: fixedRandom(0.5) })
    game.guess(6)

    expect(() => game.guess(6)).toThrow(GameOverError)
  })

  it('rejects further guesses after a loss until reset', () => {
    const game = new GuessingGame({ min: 1, max: 10, maxAttempts: 1, random: fixedRandom(0.5) })
    game.guess(1)

    expect(() => game.guess(1)).toThrow(GameOverError)
  })

  it('allows guesses again after reset', () => {
    const game = new GuessingGame({ min: 1, max: 10, maxAttempts: 1, random: fixedRandom(0.5) })
    game.guess(1)
    expect(game.isComplete).toBe(true)

    game.reset()

    expect(game.isComplete).toBe(false)
    expect(game.attemptsRemaining).toBe(1)
    expect(() => game.guess(6)).not.toThrow()
  })

  it('reset accepts overrides and re-validates the configuration', () => {
    const game = new GuessingGame({ min: 1, max: 10, maxAttempts: 1, random: fixedRandom(0.5) })
    game.guess(1)

    game.reset({ min: 1, max: 20, maxAttempts: 3, random: fixedRandom(0.9) })

    expect(game.min).toBe(1)
    expect(game.max).toBe(20)
    expect(game.maxAttempts).toBe(3)
    expect(game.attemptsRemaining).toBe(3)
    expect(game.guess(19).result).toBe('correct')
  })

  it('reset rejects an invalid override', () => {
    const game = new GuessingGame({ min: 1, max: 10, maxAttempts: 1, random: fixedRandom(0.5) })
    game.guess(1)

    expect(() => game.reset({ maxAttempts: 0 })).toThrow(RangeError)
  })
})
