import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  // min-h/min-w keep a ~44px touch target without forcing oversized visuals on dense panels
  const baseStyles = 'inline-flex items-center justify-center min-h-11 min-w-11 px-4 py-2 font-mono text-xs tracking-wider uppercase font-semibold transition-colors duration-200 focus:outline-none select-none rounded-[2px]'

  const variantStyles = {
    primary: 'bg-cyan text-base border border-cyan hover:bg-transparent hover:text-cyan',
    secondary: 'border border-cyan/40 text-cyan/80 bg-transparent hover:border-cyan hover:text-cyan hover:bg-cyan/5',
    ghost: 'border border-transparent text-text-muted hover:text-cyan hover:bg-cyan/5'
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
