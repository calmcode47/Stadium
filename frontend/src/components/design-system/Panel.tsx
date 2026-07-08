import React from 'react'

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  live?: boolean
  children?: React.ReactNode
}

export const Panel: React.FC<PanelProps> = ({ 
  live = false, 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <div
      className={`relative bg-surface border border-cyan/20 rounded-[4px] p-4 text-primary transition-colors duration-200 ${className}`}
      {...props}
    >
      {live && (
        <div className="absolute top-2 right-2 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan"></span>
        </div>
      )}
      {children}
    </div>
  )
}

export default Panel
