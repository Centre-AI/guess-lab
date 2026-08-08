import { useCallback, useState, type ChangeEvent, type FormEvent } from 'react'
import './App.css'
import {
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  DIFFICULTY_CONFIGS,
  DIFFICULTY_LABELS,
  type Difficulty,
} from './game/config'
import { GuessingGame, type GuessResult } from './game/guessingGame'

interface GuessEntry {
  value: number
  result: GuessResult
}

interface Range {
  min: number
  max: number
}

function createGame(difficulty: Difficulty): GuessingGame {
  return new GuessingGame(DIFFICULTY_CONFIGS[difficulty])
}

function messageFor(result: GuessResult | null, range: Range, target?: number): string {
  switch (result) {
    case 'low':
      return 'Higher! Try a bigger number.'
    case 'high':
      return 'Lower! Try a smaller number.'
    case 'correct':
      return `Correct! The number was ${target}.`
    case 'lost':
      return `Game over! The number was ${target}.`
    case 'invalid':
      return `Enter a whole number between ${range.min} and ${range.max}.`
    case null:
      return `Guess a number between ${range.min} and ${range.max}.`
  }
}

function labelFor(result: GuessResult): string {
  switch (result) {
    case 'low':
      return 'too low'
    case 'high':
      return 'too high'
    case 'correct':
      return 'correct'
    case 'lost':
      return 'out of attempts'
    case 'invalid':
      return 'invalid'
  }
}

function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>(DEFAULT_DIFFICULTY)
  const [game, setGame] = useState(() => createGame(DEFAULT_DIFFICULTY))
  const [guesses, setGuesses] = useState<GuessEntry[]>([])
  const [inputValue, setInputValue] = useState('')
  const [message, setMessage] = useState(() => messageFor(null, game))
  const [attemptsRemaining, setAttemptsRemaining] = useState(() => game.attemptsRemaining)
  const [isComplete, setIsComplete] = useState(false)

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (isComplete || inputValue.trim() === '') {
        return
      }

      const parsedGuess = Number(inputValue)
      const outcome = game.guess(parsedGuess)

      setAttemptsRemaining(outcome.attemptsRemaining)
      setMessage(messageFor(outcome.result, game, outcome.target))

      if (outcome.result !== 'invalid') {
        setGuesses((previous) => [...previous, { value: parsedGuess, result: outcome.result }])
        setInputValue('')
      }

      if (outcome.result === 'correct' || outcome.result === 'lost') {
        setIsComplete(true)
      }
    },
    [game, inputValue, isComplete],
  )

  const startNewGame = useCallback((nextDifficulty: Difficulty) => {
    const nextGame = createGame(nextDifficulty)
    setDifficulty(nextDifficulty)
    setGame(nextGame)
    setGuesses([])
    setInputValue('')
    setMessage(messageFor(null, nextGame))
    setAttemptsRemaining(nextGame.attemptsRemaining)
    setIsComplete(false)
  }, [])

  const handleNewGame = useCallback(() => {
    startNewGame(difficulty)
  }, [difficulty, startNewGame])

  const handleDifficultyChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      startNewGame(event.target.value as Difficulty)
    },
    [startNewGame],
  )

  return (
    <main className="app">
      <h1>Guess Lab</h1>

      <div className="app__difficulty">
        <label htmlFor="difficulty-select">Difficulty</label>
        <select id="difficulty-select" value={difficulty} onChange={handleDifficultyChange}>
          {DIFFICULTIES.map((level) => (
            <option key={level} value={level}>
              {DIFFICULTY_LABELS[level]}
            </option>
          ))}
        </select>
      </div>

      <p className="app__range">
        {DIFFICULTY_LABELS[difficulty]} difficulty — range {game.min}–{game.max}, {game.maxAttempts}{' '}
        attempts
      </p>

      <p className="app__status" role="status">
        {message}
      </p>
      <p className="app__attempts">Attempts remaining: {attemptsRemaining}</p>

      <form className="app__form" onSubmit={handleSubmit}>
        <label htmlFor="guess-input">
          Your guess ({game.min}-{game.max})
        </label>
        <input
          id="guess-input"
          type="number"
          step={1}
          min={game.min}
          max={game.max}
          value={inputValue}
          disabled={isComplete}
          onChange={(event) => setInputValue(event.target.value)}
        />
        <button type="submit" disabled={isComplete || inputValue.trim() === ''}>
          Submit guess
        </button>
      </form>

      <button type="button" className="app__new-game" onClick={handleNewGame}>
        New Game
      </button>

      <section className="app__history">
        <h2>Previous guesses</h2>
        {guesses.length === 0 ? (
          <p>No guesses yet.</p>
        ) : (
          <ul>
            {guesses.map((entry, index) => (
              <li key={index}>
                {entry.value} — {labelFor(entry.result)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App
