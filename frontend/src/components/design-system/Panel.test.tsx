import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Panel from './Panel'

describe('Panel Component', () => {
  it('renders children correctly', () => {
    render(<Panel><span>Panel Content</span></Panel>)
    expect(screen.getByText('Panel Content')).toBeInTheDocument()
  })

  it('toggles the live indicator pulse based on the live prop', () => {
    // Case A: live={false} (default)
    const { container, rerender } = render(<Panel>Content</Panel>)
    expect(container.querySelector('.animate-ping')).not.toBeInTheDocument()

    // Case B: live={true}
    rerender(<Panel live={true}>Content</Panel>)
    expect(container.querySelector('.animate-ping')).toBeInTheDocument()
  })
})
