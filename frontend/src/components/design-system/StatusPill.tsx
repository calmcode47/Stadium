import React from 'react'
import Radio from 'lucide-react/dist/esm/icons/radio.mjs'
import CalendarClock from 'lucide-react/dist/esm/icons/calendar-clock.mjs'
import CircleCheck from 'lucide-react/dist/esm/icons/circle-check.mjs'
import ClockAlert from 'lucide-react/dist/esm/icons/clock-alert.mjs'
import Ban from 'lucide-react/dist/esm/icons/ban.mjs'

export type StatusVariant = 'live' | 'scheduled' | 'completed' | 'delayed' | 'cancelled'

interface StatusPillProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: StatusVariant
}

type StatusIcon = React.ComponentType<{ size?: number | string; className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>

const variantMeta: Record<
  StatusVariant,
  { border: string; text: string; bg: string; Icon: StatusIcon }
> = {
  live: {
    border: 'border-cyan',
    text: 'text-cyan',
    bg: 'bg-cyan/10',
    Icon: Radio
  },
  scheduled: {
    border: 'border-text-muted/40',
    text: 'text-text-muted',
    bg: 'bg-text-muted/5',
    Icon: CalendarClock
  },
  completed: {
    border: 'border-success',
    text: 'text-success',
    bg: 'bg-success/10',
    Icon: CircleCheck
  },
  delayed: {
    border: 'border-amber',
    text: 'text-amber',
    bg: 'bg-amber/10',
    Icon: ClockAlert
  },
  cancelled: {
    border: 'border-danger',
    text: 'text-danger',
    bg: 'bg-danger/10',
    Icon: Ban
  }
}

export const StatusPill: React.FC<StatusPillProps> = ({
  variant,
  className = '',
  ...props
}) => {
  const style = variantMeta[variant]
  const Icon = style.Icon

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-none border font-mono text-[10px] tracking-wider uppercase font-semibold select-none ${style.border} ${style.text} ${style.bg} ${className}`}
      {...props}
    >
      {/* Distinct icon per state so status is not color-only (text label + shape). */}
      <Icon size={10} className="shrink-0" aria-hidden="true" />
      <span>{variant}</span>
    </div>
  )
}

export default StatusPill
