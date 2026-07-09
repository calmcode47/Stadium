import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ScoreDigit from './ScoreDigit'

describe('ScoreDigit Component', () => {
  it('displays the passed value', () => {
    render(<ScoreDigit value={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('re-renders and displays new values when props update', () => {
    const { rerender } = render(<ScoreDigit value={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()

    rerender(<ScoreDigit value={9} />)
    expect(screen.getByText('9')).toBeInTheDocument()
    expect(screen.queryByText('5')).not.toBeInTheDocument()
  })
})
