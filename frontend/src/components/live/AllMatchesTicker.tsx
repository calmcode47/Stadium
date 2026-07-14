import React from 'react'
import type { Match } from '@/types/operations'
import Panel from '@/components/design-system/Panel'
import DataLabel from '@/components/design-system/DataLabel'
import StatusPill from '@/components/design-system/StatusPill'
import ScoreDigit from '@/components/design-system/ScoreDigit'

interface AllMatchesTickerProps {
  matches: Match[]
  onSelectMatch: (matchId: string) => void
  selectedMatchId: string | null
}

export const AllMatchesTicker: React.FC<AllMatchesTickerProps> = ({
  matches,
  onSelectMatch,
  selectedMatchId
}) => {
  // Helper to map team names to short abbreviations
  const getAbbr = (team: string): string => {
    const clean = team.toUpperCase()
    if (clean.includes('REAL MADRID')) return 'RMA'
    if (clean.includes('MANCHESTER CITY')) return 'MCI'
    if (clean.includes('BAYERN MUNICH')) return 'FCB'
    if (clean.includes('PARIS') || clean.includes('PSG')) return 'PSG'
    if (clean.includes('AC MILAN')) return 'ACM'
    if (clean.includes('INTER MILAN')) return 'INT'
    if (clean.includes('BARCELONA')) return 'BAR'
    if (clean.includes('JUVENTUS')) return 'JUV'
    if (clean.includes('LIVERPOOL')) return 'LIV'
    if (clean.includes('ARSENAL')) return 'ARS'
    return clean.slice(0, 3)
  }

  return (
    <div className="flex flex-col gap-4">
      
      {/* Readout bar */}
      <div className="flex items-center justify-between border-b border-cyan/15 pb-2">
        <DataLabel>ALL CONNECTED MATCH CORE CHANNELS</DataLabel>
        <span className="font-mono text-[9px] text-text-muted uppercase">
          HIGH DENSITY WALL VIEW MONITORING
        </span>
      </div>

      {/* Grid of ticker cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {matches.map((match) => {
          const isLive = match.status === 'live'
          const isSelected = selectedMatchId === match.id

          return (
            <div
              key={match.id}
              onClick={() => onSelectMatch(match.id)}
              className={`cursor-pointer transition-all duration-150 relative ${
                isSelected ? 'ring-1 ring-cyan rounded-[4px]' : ''
              }`}
            >
              <Panel
                live={isLive}
                className={`p-3 hover:border-cyan/45 flex flex-col justify-between min-h-[110px] bg-elevated/35 border ${
                  isSelected ? 'border-cyan/50 bg-cyan/5' : 'border-cyan/15'
                }`}
              >
                {/* Header: ID & Period */}
                <div className="flex justify-between items-center border-b border-cyan/5 pb-1 mb-2 font-mono text-[9px]">
                  <span className="text-text-muted">{match.id}</span>
                  <StatusPill variant={match.status} />
                </div>

                {/* Score & Abbreviations Body */}
                <div className="flex items-center justify-between my-1">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-text-primary">
                    <span>{getAbbr(match.teamHome)}</span>
                    <span className="text-[10px] text-text-muted">VS</span>
                    <span>{getAbbr(match.teamAway)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 bg-base/50 px-1.5 py-0.5 rounded-[1px] border border-cyan/5">
                    <ScoreDigit value={match.scoreHome} colorVariant={isLive ? 'cyan' : 'primary'} className="text-xs" />
                    <span className="font-mono text-[10px] text-text-muted">:</span>
                    <ScoreDigit value={match.scoreAway} colorVariant={isLive ? 'cyan' : 'primary'} className="text-xs" />
                  </div>
                </div>

                {/* Footer: Running Clock */}
                <div className="flex justify-between items-center text-[9px] font-mono text-text-muted pt-1 border-t border-cyan/5 mt-2">
                  <span>CLOCK:</span>
                  <span className={isLive ? 'text-cyan font-bold' : 'text-text-muted'}>
                    {isLive ? `${match.timeElapsed}'` : '--'}
                  </span>
                </div>
              </Panel>
            </div>
          )
        })}
      </div>

    </div>
  )
}

export default AllMatchesTicker
