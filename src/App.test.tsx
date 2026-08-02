import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { GAME_CONFIG } from './game/config'

function mockRandom(value: number) {
  vi.spyOn(Math, 'random').mockReturnValue(value)
}

function submitGuess(value: string) {
  const input = screen.getByLabelText(/your guess/i)
  fireEvent.change(input, { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: /submit guess/i }))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('App', () => {
  it('renders the Guess Lab heading and the initial game state', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Guess Lab' })).toBeInTheDocument()
    expect(
      screen.getByText(`Attempts remaining: ${GAME_CONFIG.maxAttempts}`),
    ).toBeInTheDocument()
    expect(screen.getByText('No guesses yet.')).toBeInTheDocument()
  })

  it('lets the player enter and submit a whole-number guess', () => {
    mockRandom(0) // target === GAME_CONFIG.min

    render(<App />)
    submitGuess(String(GAME_CONFIG.max))

    expect(
      screen.getByText(`Attempts remaining: ${GAME_CONFIG.maxAttempts - 1}`),
    ).toBeInTheDocument()
    expect(screen.getByRole('listitem')).toHaveTextContent(`${GAME_CONFIG.max} — too high`)
  })

  it('shows higher feedback when the guess is below the target', () => {
    mockRandom(0.999999) // target === GAME_CONFIG.max

    render(<App />)
    submitGuess(String(GAME_CONFIG.min))

    expect(screen.getByRole('status')).toHaveTextContent(/higher! try a bigger number/i)
  })

  it('shows lower feedback when the guess is above the target', () => {
    mockRandom(0) // target === GAME_CONFIG.min

    render(<App />)
    submitGuess(String(GAME_CONFIG.max))

    expect(screen.getByRole('status')).toHaveTextContent(/lower! try a smaller number/i)
  })

  it('lists previous guesses from the current game in order', () => {
    mockRandom(0) // target === GAME_CONFIG.min

    render(<App />)
    submitGuess(String(GAME_CONFIG.max))
    submitGuess(String(GAME_CONFIG.max - 1))

    const historyItems = screen.getAllByRole('listitem')
    expect(historyItems).toHaveLength(2)
    expect(historyItems[0]).toHaveTextContent(`${GAME_CONFIG.max} — too high`)
    expect(historyItems[1]).toHaveTextContent(`${GAME_CONFIG.max - 1} — too high`)
  })

  it('walks through a winning game and disables further guesses', () => {
    mockRandom(0) // target === GAME_CONFIG.min

    render(<App />)
    submitGuess(String(GAME_CONFIG.max)) // wrong guess first
    submitGuess(String(GAME_CONFIG.min)) // correct guess

    expect(screen.getByRole('status')).toHaveTextContent(
      `Correct! The number was ${GAME_CONFIG.min}.`,
    )
    expect(screen.getByRole('button', { name: /submit guess/i })).toBeDisabled()
    expect(screen.getByLabelText(/your guess/i)).toBeDisabled()
  })

  it('walks through a losing game once attempts are exhausted', () => {
    mockRandom(0) // target === GAME_CONFIG.min, so guessing max is always wrong

    render(<App />)

    for (let attempt = 0; attempt < GAME_CONFIG.maxAttempts; attempt += 1) {
      submitGuess(String(GAME_CONFIG.max))
    }

    expect(screen.getByRole('status')).toHaveTextContent(
      `Game over! The number was ${GAME_CONFIG.min}.`,
    )
    expect(screen.getByText('Attempts remaining: 0')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit guess/i })).toBeDisabled()
    expect(screen.getByLabelText(/your guess/i)).toBeDisabled()
  })

  it('resets the game when New Game is clicked', () => {
    mockRandom(0) // target === GAME_CONFIG.min

    render(<App />)
    submitGuess(String(GAME_CONFIG.min)) // correct guess, ends the game
    expect(screen.getByRole('status')).toHaveTextContent(/correct!/i)

    fireEvent.click(screen.getByRole('button', { name: /new game/i }))

    expect(
      screen.getByText(`Attempts remaining: ${GAME_CONFIG.maxAttempts}`),
    ).toBeInTheDocument()
    expect(screen.getByText('No guesses yet.')).toBeInTheDocument()
    expect(screen.getByLabelText(/your guess/i)).not.toBeDisabled()

    submitGuess(String(GAME_CONFIG.min + 1))
    expect(screen.getByRole('status')).toHaveTextContent(/lower! try a smaller number/i)
  })
})
