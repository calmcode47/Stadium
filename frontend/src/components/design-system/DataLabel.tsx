import React from 'react'

interface DataLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
}

export const DataLabel: React.FC<DataLabelProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <span
      className={`font-mono text-xs tracking-wider text-text-muted uppercase select-none ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

export default DataLabel
