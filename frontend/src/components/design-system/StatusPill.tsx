import React from 'react'

export type StatusVariant = 'live' | 'scheduled' | 'completed' | 'delayed' | 'cancelled'

interface StatusPillProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: StatusVariant
}

export const StatusPill: React.FC<StatusPillProps> = ({
  variant,
  className = '',
  ...props
}) => {
  // Map variants to specific colors and border styling
  const variantStyles: Record<StatusVariant, { border: string; text: string; bg: string; dot: string }> = {
    live: {
      border: 'border-cyan',
      text: 'text-cyan',
      bg: 'bg-cyan/10',
      dot: 'bg-cyan'
    },
    scheduled: {
      border: 'border-text-muted/40',
      text: 'text-text-muted',
      bg: 'bg-text-muted/5',
      dot: 'bg-text-muted/60'
    },
    completed: {
      border: 'border-success',
      text: 'text-success',
      bg: 'bg-success/10',
      dot: 'bg-success'
    },
    delayed: {
      border: 'border-amber',
      text: 'text-amber',
      bg: 'bg-amber/10',
      dot: 'bg-amber'
    },
    cancelled: {
      border: 'border-danger',
      text: 'text-danger',
      bg: 'bg-danger/10',
      dot: 'bg-danger'
    }
  }

  const style = variantStyles[variant]

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-none border font-mono text-[10px] tracking-wider uppercase font-semibold select-none ${style.border} ${style.text} ${style.bg} ${className}`}
      {...props}
    >
      {/* Small square indicator instead of rounded dot */}
      <span className={`w-1.5 h-1.5 inline-block ${style.dot}`} />
      <span>{variant}</span>
    </div>
  )
}

export default StatusPill
