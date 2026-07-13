import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Clock from 'lucide-react/dist/esm/icons/clock.mjs'
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down.mjs'

export const TopBar: React.FC = () => {
  const location = useLocation()
  const [time, setTime] = useState('')

  // Live running clock (HH:MM:SS) updated every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hh = String(now.getHours()).padStart(2, '0')
      const mm = String(now.getMinutes()).padStart(2, '0')
      const ss = String(now.getSeconds()).padStart(2, '0')
      setTime(`${hh}:${mm}:${ss}`)
    }
    
    updateTime() // run once immediately
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // Map route pathnames to descriptive view titles
  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
        return 'Overview Center'
      case '/dashboard':
        return 'Live Operations'
      case '/stadium':
        return '3D Venue Simulator'
      case '/tournaments':
        return 'Tournament Bracket Scheduler'
      case '/live':
        return 'Live Telemetry Feed'
      case '/design-system':
        return 'Design System Suite'
      default:
        return 'Operations Portal'
    }
  }

  return (
    <header className="h-14 md:h-16 bg-surface border-b border-cyan/20 px-3 md:px-8 flex items-center justify-between z-30 select-none gap-2">
      
      {/* View Title */}
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-base sm:text-xl md:text-2xl font-display uppercase tracking-wider text-text-primary truncate">
          {getPageTitle(location.pathname)}
        </h1>
      </div>

      {/* Clock and Selector */}
      <div className="flex items-center gap-2 md:gap-6 shrink-0">
        
        {/* Running Clock */}
        <div className="flex items-center gap-1.5 md:gap-2 text-cyan font-mono text-xs md:text-sm tracking-widest bg-base/40 border border-cyan/10 px-2 md:px-3 py-1 rounded-[2px]">
          <Clock size={12} className="animate-pulse hidden sm:block" />
          <span>{time || '00:00:00'}</span>
        </div>

        {/* Venue/Tournament Selector Dropdown - Hidden on very small screens */}
        <div className="relative hidden sm:inline-block">
          <label htmlFor="context-selector" className="sr-only">Operations context selector</label>
          <select 
            id="context-selector"
            className="appearance-none bg-elevated border border-cyan/30 text-text-primary hover:border-cyan hover:text-cyan font-mono text-[10px] md:text-xs px-2 md:px-3 pr-7 md:pr-8 py-1.5 rounded-[2px] outline-none transition-colors duration-200 uppercase tracking-widest cursor-pointer"
            defaultValue="main-arena"
          >
            <option value="main-arena">MAIN VENUE Arena</option>
            <option value="east-training">EAST PRACTICE DOME</option>
            <option value="west-stadium">WEST CUP Arena</option>
            <option value="tourney-champions">CHAMPIONS TOURNEY</option>
          </select>
          {/* Custom Chevron icon */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-text-muted">
            <ChevronDown size={12} />
          </div>
        </div>

      </div>

    </header>
  )
}

export default TopBar
