import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the Guess Lab placeholder heading', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: 'Guess Lab' }),
    ).toBeInTheDocument()
  })

  it('indicates the game has not been implemented yet', () => {
    render(<App />)
    expect(screen.getByText('Game coming soon')).toBeInTheDocument()
  })
})
