import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { DIFFICULTY_CONFIGS } from './game/config'

const NORMAL = DIFFICULTY_CONFIGS.normal

function mockRandom(value: number) {
  vi.spyOn(Math, 'random').mockReturnValue(value)
}

function submitGuess(value: string) {
  const input = screen.getByLabelText(/your guess/i)
  fireEvent.change(input, { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: /submit guess/i }))
}

function selectDifficulty(label: RegExp) {
  fireEvent.change(screen.getByLabelText(/difficulty/i), {
    target: { value: screen.getByRole('option', { name: label }).getAttribute('value') },
  })
}

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe('App', () => {
  it('renders the Guess Lab heading and the initial game state', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Guess Lab' })).toBeInTheDocument()
    expect(screen.getByText(`Attempts remaining: ${NORMAL.maxAttempts}`)).toBeInTheDocument()
    expect(screen.getByText('No guesses yet.')).toBeInTheDocument()
  })

  it('defaults to Normal difficulty', () => {
    render(<App />)

    expect(screen.getByLabelText(/difficulty/i)).toHaveValue('normal')
    expect(
      screen.getByText(`Normal difficulty — range ${NORMAL.min}–${NORMAL.max}, ${NORMAL.maxAttempts} attempts`),
    ).toBeInTheDocument()
  })

  it('lets the player enter and submit a whole-number guess', () => {
    mockRandom(0) // target === NORMAL.min

    render(<App />)
    submitGuess(String(NORMAL.max))

    expect(screen.getByText(`Attempts remaining: ${NORMAL.maxAttempts - 1}`)).toBeInTheDocument()
    expect(screen.getByRole('listitem')).toHaveTextContent(`${NORMAL.max} — too high`)
  })

  it('shows higher feedback when the guess is below the target', () => {
    mockRandom(0.999999) // target === NORMAL.max

    render(<App />)
    submitGuess(String(NORMAL.min))

    expect(screen.getByRole('status')).toHaveTextContent(/higher! try a bigger number/i)
  })

  it('shows lower feedback when the guess is above the target', () => {
    mockRandom(0) // target === NORMAL.min

    render(<App />)
    submitGuess(String(NORMAL.max))

    expect(screen.getByRole('status')).toHaveTextContent(/lower! try a smaller number/i)
  })

  it('lists previous guesses from the current game in order', () => {
    mockRandom(0) // target === NORMAL.min

    render(<App />)
    submitGuess(String(NORMAL.max))
    submitGuess(String(NORMAL.max - 1))

    const historyItems = screen.getAllByRole('listitem')
    expect(historyItems).toHaveLength(2)
    expect(historyItems[0]).toHaveTextContent(`${NORMAL.max} — too high`)
    expect(historyItems[1]).toHaveTextContent(`${NORMAL.max - 1} — too high`)
  })

  it('walks through a winning game and disables further guesses', () => {
    mockRandom(0) // target === NORMAL.min

    render(<App />)
    submitGuess(String(NORMAL.max)) // wrong guess first
    submitGuess(String(NORMAL.min)) // correct guess

    expect(screen.getByRole('status')).toHaveTextContent(`Correct! The number was ${NORMAL.min}.`)
    expect(screen.getByRole('button', { name: /submit guess/i })).toBeDisabled()
    expect(screen.getByLabelText(/your guess/i)).toBeDisabled()
  })

  it('walks through a losing game once attempts are exhausted', () => {
    mockRandom(0) // target === NORMAL.min, so guessing max is always wrong

    render(<App />)

    for (let attempt = 0; attempt < NORMAL.maxAttempts; attempt += 1) {
      submitGuess(String(NORMAL.max))
    }

    expect(screen.getByRole('status')).toHaveTextContent(`Game over! The number was ${NORMAL.min}.`)
    expect(screen.getByText('Attempts remaining: 0')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit guess/i })).toBeDisabled()
    expect(screen.getByLabelText(/your guess/i)).toBeDisabled()
  })

  it('resets the game when New Game is clicked', () => {
    mockRandom(0) // target === NORMAL.min

    render(<App />)
    submitGuess(String(NORMAL.min)) // correct guess, ends the game
    expect(screen.getByRole('status')).toHaveTextContent(/correct!/i)

    fireEvent.click(screen.getByRole('button', { name: /new game/i }))

    expect(screen.getByText(`Attempts remaining: ${NORMAL.maxAttempts}`)).toBeInTheDocument()
    expect(screen.getByText('No guesses yet.')).toBeInTheDocument()
    expect(screen.getByLabelText(/your guess/i)).not.toBeDisabled()

    submitGuess(String(NORMAL.min + 1))
    expect(screen.getByRole('status')).toHaveTextContent(/lower! try a smaller number/i)
  })

  describe('difficulty levels', () => {
    it('switches to Easy: numbers 1-50 with 7 attempts', () => {
      render(<App />)

      selectDifficulty(/^Easy$/)

      const easy = DIFFICULTY_CONFIGS.easy
      expect(screen.getByLabelText(/difficulty/i)).toHaveValue('easy')
      expect(
        screen.getByText(`Easy difficulty — range ${easy.min}–${easy.max}, ${easy.maxAttempts} attempts`),
      ).toBeInTheDocument()
      expect(screen.getByText(`Attempts remaining: ${easy.maxAttempts}`)).toBeInTheDocument()
    })

    it('switches to Normal: numbers 1-100 with 8 attempts', () => {
      render(<App />)

      selectDifficulty(/^Easy$/)
      selectDifficulty(/^Normal$/)

      expect(screen.getByLabelText(/difficulty/i)).toHaveValue('normal')
      expect(
        screen.getByText(
          `Normal difficulty — range ${NORMAL.min}–${NORMAL.max}, ${NORMAL.maxAttempts} attempts`,
        ),
      ).toBeInTheDocument()
      expect(screen.getByText(`Attempts remaining: ${NORMAL.maxAttempts}`)).toBeInTheDocument()
    })

    it('switches to Hard: numbers 1-500 with 10 attempts', () => {
      render(<App />)

      selectDifficulty(/^Hard$/)

      const hard = DIFFICULTY_CONFIGS.hard
      expect(screen.getByLabelText(/difficulty/i)).toHaveValue('hard')
      expect(
        screen.getByText(`Hard difficulty — range ${hard.min}–${hard.max}, ${hard.maxAttempts} attempts`),
      ).toBeInTheDocument()
      expect(screen.getByText(`Attempts remaining: ${hard.maxAttempts}`)).toBeInTheDocument()
    })

    it('starts a clean new game when difficulty changes mid-game', () => {
      mockRandom(0)

      render(<App />)
      submitGuess(String(NORMAL.max))
      expect(screen.getAllByRole('listitem')).toHaveLength(1)

      selectDifficulty(/^Hard$/)

      expect(screen.getByText('No guesses yet.')).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent(/guess a number between/i)
      expect(screen.getByLabelText(/your guess/i)).not.toBeDisabled()
    })

    it('clears a completed game when difficulty changes', () => {
      mockRandom(0) // target === NORMAL.min

      render(<App />)
      submitGuess(String(NORMAL.min)) // correct guess, ends the game
      expect(screen.getByRole('button', { name: /submit guess/i })).toBeDisabled()

      selectDifficulty(/^Easy$/)

      expect(screen.getByLabelText(/your guess/i)).not.toBeDisabled()
      expect(screen.getByText('No guesses yet.')).toBeInTheDocument()
    })
  })

  describe('statistics', () => {
    it('starts with zeroed statistics when nothing has been saved', () => {
      render(<App />)

      expect(screen.getByText('Wins').nextElementSibling).toHaveTextContent('0')
      expect(screen.getByText('Losses').nextElementSibling).toHaveTextContent('0')
      expect(screen.getByText('Current streak').nextElementSibling).toHaveTextContent('0')
      expect(screen.getByText('Best attempts (Normal)').nextElementSibling).toHaveTextContent(
        'Not yet won',
      )
    })

    it('records a win, the streak and the best attempt count for the active difficulty', () => {
      mockRandom(0) // target === NORMAL.min

      render(<App />)
      submitGuess(String(NORMAL.max)) // wrong guess
      submitGuess(String(NORMAL.min)) // correct guess: 2 attempts used

      expect(screen.getByText('Wins').nextElementSibling).toHaveTextContent('1')
      expect(screen.getByText('Current streak').nextElementSibling).toHaveTextContent('1')
      expect(screen.getByText('Best attempts (Normal)').nextElementSibling).toHaveTextContent('2')
    })

    it('records a loss and resets the streak', () => {
      mockRandom(0) // target === NORMAL.min, guessing max is always wrong

      render(<App />)
      for (let attempt = 0; attempt < NORMAL.maxAttempts; attempt += 1) {
        submitGuess(String(NORMAL.max))
      }

      expect(screen.getByText('Losses').nextElementSibling).toHaveTextContent('1')
      expect(screen.getByText('Current streak').nextElementSibling).toHaveTextContent('0')
    })

    it('persists statistics across a simulated reload', () => {
      mockRandom(0) // target === NORMAL.min

      const { unmount } = render(<App />)
      submitGuess(String(NORMAL.min)) // correct guess, 1 attempt
      unmount()

      render(<App />)

      expect(screen.getByText('Wins').nextElementSibling).toHaveTextContent('1')
      expect(screen.getByText('Best attempts (Normal)').nextElementSibling).toHaveTextContent('1')
    })

    it('recovers safely when saved statistics are corrupt', () => {
      window.localStorage.setItem('guess-lab:statistics:v1', '{not valid json')

      render(<App />)

      expect(screen.getByText('Wins').nextElementSibling).toHaveTextContent('0')
    })

    it('recovers safely when saved statistics have an incompatible shape', () => {
      window.localStorage.setItem(
        'guess-lab:statistics:v1',
        JSON.stringify({ someOldField: 'nope' }),
      )

      render(<App />)

      expect(screen.getByText('Wins').nextElementSibling).toHaveTextContent('0')
    })

    it('lets the player reset all statistics', () => {
      mockRandom(0) // target === NORMAL.min

      render(<App />)
      submitGuess(String(NORMAL.min)) // correct guess
      expect(screen.getByText('Wins').nextElementSibling).toHaveTextContent('1')

      fireEvent.click(screen.getByRole('button', { name: /reset statistics/i }))

      expect(screen.getByText('Wins').nextElementSibling).toHaveTextContent('0')
      expect(screen.getByText('Best attempts (Normal)').nextElementSibling).toHaveTextContent(
        'Not yet won',
      )
    })
  })

  describe('accessibility', () => {
    it('gives the guess input and difficulty select programmatic labels', () => {
      render(<App />)

      expect(screen.getByLabelText(/your guess/i)).toBe(screen.getByRole('spinbutton'))
      expect(screen.getByLabelText(/difficulty/i)).toBe(screen.getByRole('combobox'))
    })

    it('announces feedback through a polite ARIA live region', () => {
      mockRandom(0) // target === NORMAL.min

      render(<App />)
      const liveRegion = screen.getByRole('status')
      expect(liveRegion).toHaveAttribute('aria-live', 'polite')

      submitGuess(String(NORMAL.max))

      expect(liveRegion).toHaveTextContent(/lower! try a smaller number/i)
    })

    it('can be played using only the keyboard', () => {
      mockRandom(0) // target === NORMAL.min

      render(<App />)
      const input = screen.getByLabelText(/your guess/i)

      input.focus()
      expect(input).toHaveFocus()

      fireEvent.change(input, { target: { value: String(NORMAL.min) } })
      fireEvent.submit(input.closest('form') as HTMLFormElement)

      expect(screen.getByRole('status')).toHaveTextContent(/correct!/i)

      const newGameButton = screen.getByRole('button', { name: /new game/i })
      newGameButton.focus()
      expect(newGameButton).toHaveFocus()
      fireEvent.click(newGameButton)

      expect(screen.getByLabelText(/your guess/i)).not.toBeDisabled()
    })

    it('conveys guess outcomes with text and symbols, not colour alone', () => {
      mockRandom(0) // target === NORMAL.min

      render(<App />)
      submitGuess(String(NORMAL.max))

      const item = screen.getByRole('listitem')
      expect(item).toHaveTextContent('too high')
      expect(item.className).toContain('app__history-item--high')
    })
  })
})
