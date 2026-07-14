import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StatusPill from './StatusPill'

describe('StatusPill Component', () => {
  it('renders correctly for live variant', () => {
    const { container } = render(<StatusPill variant="live" />)
    expect(screen.getByText('live')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('text-cyan', 'border-cyan', 'bg-cyan/10')
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders correctly for scheduled variant', () => {
    const { container } = render(<StatusPill variant="scheduled" />)
    expect(screen.getByText('scheduled')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('text-text-muted', 'bg-text-muted/5')
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders correctly for completed variant', () => {
    const { container } = render(<StatusPill variant="completed" />)
    expect(screen.getByText('completed')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('text-success', 'border-success', 'bg-success/10')
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders correctly for delayed variant', () => {
    const { container } = render(<StatusPill variant="delayed" />)
    expect(screen.getByText('delayed')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('text-amber', 'border-amber', 'bg-amber/10')
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders correctly for cancelled variant', () => {
    const { container } = render(<StatusPill variant="cancelled" />)
    expect(screen.getByText('cancelled')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('text-danger', 'border-danger', 'bg-danger/10')
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
