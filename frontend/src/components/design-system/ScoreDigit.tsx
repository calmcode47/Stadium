import React from 'react'
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'

interface ScoreDigitProps extends HTMLMotionProps<'span'> {
  value: string | number
  colorVariant?: 'amber' | 'cyan' | 'primary'
}

export const ScoreDigit: React.FC<ScoreDigitProps> = ({
  value,
  colorVariant = 'primary',
  className = '',
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion()

  // Map color variants to Tailwind colors
  const colorMap = {
    primary: 'text-primary',
    cyan: 'text-cyan',
    amber: 'text-amber'
  }

  // Neon glow colors for the update flash effect
  const glowColors = {
    primary: 'rgba(232, 237, 242, 0.8)', // text-primary glow
    cyan: 'rgba(0, 233, 255, 0.8)',       // cyan glow
    amber: 'rgba(255, 176, 32, 0.8)'      // amber glow
  }

  return (
    <motion.span
      key={value}
      aria-live="polite"
      initial={shouldReduceMotion ? { opacity: 1 } : { 
        opacity: 0.6,
        textShadow: `0 0 20px ${glowColors[colorVariant]}`,
        scale: 0.98
      }}
      animate={shouldReduceMotion ? { opacity: 1 } : { 
        opacity: 1,
        textShadow: '0 0 0px rgba(0, 0, 0, 0)',
        scale: 1
      }}
      transition={shouldReduceMotion ? { duration: 0 } : { 
        duration: 0.35, 
        ease: 'easeOut' 
      }}
      className={`font-display inline-block leading-none select-none ${colorMap[colorVariant]} ${className}`}
      style={{ fontSize: 'inherit' }}
      {...props}
    >
      {value}
    </motion.span>
  )
}

export default ScoreDigit
