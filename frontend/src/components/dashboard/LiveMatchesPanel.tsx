import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import type { Match } from '@/types/operations'
import Panel from '@/components/design-system/Panel'
import DataLabel from '@/components/design-system/DataLabel'
import ScoreDigit from '@/components/design-system/ScoreDigit'
import StatusPill from '@/components/design-system/StatusPill'

interface LiveMatchesPanelProps {
  matches: Match[]
}

export const LiveMatchesPanel: React.FC<LiveMatchesPanelProps> = ({ matches }) => {
  const navigate = useNavigate()
  
  // Running timers for live matches to simulate tick activity
  const [liveTimes, setLiveTimes] = useState<Record<string, number>>({})

  useEffect(() => {
    // Initialise live match times from static props
    const initialTimes: Record<string, number> = {}
    matches.forEach(m => {
      if (m.isLive) {
        initialTimes[m.id] = m.timeElapsed
      }
    })
    setLiveTimes(initialTimes)

    // Tick live matches once every 10 seconds to show dynamic movement
    const interval = setInterval(() => {
      setLiveTimes(prev => {
        const next = { ...prev }
        Object.keys(next).forEach(id => {
          if (next[id] < 90) {
            next[id] += 1
          }
        })
        return next
      })
    }, 10000)

    return () => clearInterval(interval)
  }, [matches])

  const handleRowClick = (matchId: string) => {
    navigate(`/live/${matchId}`)
  }

  return (
    <Panel className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-cyan/15 pb-2">
        <DataLabel>MATCH CORE STATUS REGISTRY</DataLabel>
        <span className="font-mono text-[9px] text-cyan/70 uppercase">
          {matches.filter(m => m.isLive).length} ACTIVE SOCKETS
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {matches.map((match) => {
          const isMatchLive = match.status === 'live'
          const displayTime = isMatchLive ? `${liveTimes[match.id] || match.timeElapsed}'` : '--'

          return (
            <div
              key={match.id}
              onClick={() => handleRowClick(match.id)}
              className={`flex flex-wrap items-center justify-between gap-2 p-3 bg-elevated/45 hover:bg-elevated/80 border border-cyan/5 hover:border-cyan/35 cursor-pointer select-none transition-all duration-200 group relative rounded-[2px] ${
                isMatchLive ? 'border-l-[3px] border-l-cyan pl-2.5' : 'pl-3'
              }`}
            >
              {/* Left Side: Teams & Live Clock */}
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-4">
                <div className="flex items-center gap-2">
                  {isMatchLive && (
                    <Play size={10} className="text-cyan fill-cyan animate-pulse shrink-0" />
                  )}
                  <span className="font-mono text-xs text-text-primary tracking-wide font-medium">
                    {match.teamHome} <span className="text-text-muted text-[10px]">VS</span> {match.teamAway}
                  </span>
                </div>
                
                {/* Match Timer */}
                <div className="font-mono text-[10px] text-text-muted flex items-center gap-1.5">
                  <span className="text-text-muted">CLOCK:</span>
                  <span className={isMatchLive ? 'text-cyan font-bold' : 'text-text-muted'}>
                    {displayTime}
                  </span>
                </div>
              </div>

              {/* Right Side: ScoreDigits & StatusPill */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-base/60 border border-cyan/10 px-2 py-0.5 rounded-[2px]">
                  <ScoreDigit value={match.scoreHome} colorVariant={isMatchLive ? 'cyan' : 'primary'} className="text-sm" />
                  <span className="font-mono text-[10px] text-text-muted">:</span>
                  <ScoreDigit value={match.scoreAway} colorVariant={isMatchLive ? 'cyan' : 'primary'} className="text-sm" />
                </div>
                <StatusPill variant={match.status} className="shrink-0" />
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

export default LiveMatchesPanel
