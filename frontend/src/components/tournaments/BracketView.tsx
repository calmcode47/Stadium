import React from 'react'
import type { Round } from '@/types/operations'
import Panel from '@/components/design-system/Panel'
import DataLabel from '@/components/design-system/DataLabel'
import StatusPill from '@/components/design-system/StatusPill'
import ScoreDigit from '@/components/design-system/ScoreDigit'

interface BracketViewProps {
  rounds: Round[]
}

export const BracketView: React.FC<BracketViewProps> = ({ rounds }) => {
  return (
    <div className="w-full bg-surface/20 border border-cyan/15 rounded-[4px] p-3 sm:p-6 overflow-x-auto flex flex-col gap-4">
      
      {/* Title / Log bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan/10 pb-2">
        <DataLabel>SINGLE ELIMINATION CHAMPIONS MATRIX</DataLabel>
        <span className="font-mono text-[9px] text-cyan/70 uppercase hidden sm:inline break-words">
          HORIZONTAL TRACKER // DRAG OR SCROLL TO VIEW ALL ROUNDS
        </span>
      </div>

      {/* Bracket flex row - intentional horizontal scroll; cards grow with text zoom */}
      <div className="flex gap-6 sm:gap-12 md:gap-16 overflow-x-auto pb-6 pt-4 scrollbar-thin scrollbar-thumb-cyan/20 scrollbar-track-base/30 select-none">
        {rounds.map((round) => {
          const isFinalRound = round.id === rounds.length

          return (
            <div 
              key={round.id} 
              className="flex flex-col justify-around min-w-[14rem] sm:min-w-[16rem] md:min-w-[18rem] py-4 relative gap-8 min-h-[28rem]"
            >
              {/* Round Header Label */}
              <div className="absolute top-0 left-0 right-0 text-center border-b border-cyan/5 pb-1">
                <DataLabel className="text-cyan text-[10px]">{round.name}</DataLabel>
              </div>

              {/* Round matches list */}
              {round.matches.map((match, idx) => {
                const hasWinner = match.winner !== undefined
                const isHomeWinner = match.winner === 'home'
                const isAwayWinner = match.winner === 'away'
                const isLive = match.status === 'live'

                // Class styles for active route highlighting
                const homeRouteHighlight = isHomeWinner && hasWinner
                const awayRouteHighlight = isAwayWinner && hasWinner

                // Determine height/positioning of vertical CSS connector lines based on round index
                // Round 1 -> Round 2: 64px offset. Round 2 -> Round 3: 128px offset.
                const connectorHeightClass = round.id === 1 
                  ? 'h-[64px] md:h-[72px]' 
                  : 'h-[128px] md:h-[144px]'

                // Determine if connector goes UP or DOWN
                // Even matches in column (0, 2) go DOWN. Odd matches (1, 3) go UP.
                const isEven = idx % 2 === 0
                const connectorDirClass = isEven
                  ? `border-r border-b top-1/2 ${connectorHeightClass}`
                  : `border-r border-t bottom-1/2 ${connectorHeightClass}`

                const isPathActive = hasWinner // If match has a winner, the connecting branch is highlighted

                return (
                  <div key={match.id} className="relative py-2">
                    
                    {/* Match Card Panel Container */}
                    <Panel 
                      live={isLive}
                      className={`relative z-10 p-3 hover:border-cyan/50 transition-colors duration-150 rounded-[2px] bg-elevated/40 border border-cyan/15 overflow-visible ${
                        isLive ? 'border-l-[3px] border-l-cyan pl-2.5' : ''
                      }`}
                    >
                      {/* Match Meta: ID, Time, Date, Status */}
                      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-cyan/5 pb-2 mb-2 font-mono text-[9px]">
                        <span className="text-text-muted break-words">{match.id} // {match.time}</span>
                        <StatusPill variant={match.status} />
                      </div>

                      {/* Competitor List */}
                      <div className="flex flex-col gap-2 font-mono text-xs">
                        
                        {/* Home Team */}
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <span className={`break-words min-w-0 ${
                            homeRouteHighlight 
                              ? 'text-cyan font-semibold' 
                              : isAwayWinner 
                                ? 'text-text-muted' 
                                : 'text-text-primary'
                          }`}>
                            {match.teamHome}
                          </span>
                          <ScoreDigit 
                            value={match.scoreHome !== undefined ? match.scoreHome : '-'} 
                            colorVariant={homeRouteHighlight ? 'cyan' : 'primary'} 
                            className="text-xs" 
                          />
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <span className={`break-words min-w-0 ${
                            awayRouteHighlight 
                              ? 'text-cyan font-semibold' 
                              : isHomeWinner 
                                ? 'text-text-muted' 
                                : 'text-text-primary'
                          }`}>
                            {match.teamAway}
                          </span>
                          <ScoreDigit 
                            value={match.scoreAway !== undefined ? match.scoreAway : '-'} 
                            colorVariant={awayRouteHighlight ? 'cyan' : 'primary'} 
                            className="text-xs" 
                          />
                        </div>

                      </div>
                    </Panel>

                    {/* CSS Connection Lines drawing paths to the next round */}
                    {!isFinalRound && (
                      <>
                        {/* Horizontal segment leaving the card */}
                        <div 
                          className={`absolute top-1/2 right-[-24px] w-[24px] h-px z-0 transition-colors duration-300 ${
                            isPathActive ? 'bg-cyan' : 'bg-cyan/10'
                          }`}
                        />
                        {/* Vertical bending connector */}
                        <div 
                          className={`absolute right-[-24px] w-[24px] z-0 transition-colors duration-300 ${connectorDirClass} ${
                            isPathActive ? 'border-cyan' : 'border-cyan/10'
                          }`}
                        />
                      </>
                    )}

                    {/* Input left-side line for Semifinals and Finals entering the card */}
                    {round.id > 1 && (
                      <div 
                        className={`absolute top-1/2 left-[-16px] w-[16px] h-px z-0 transition-colors duration-300 ${
                          hasWinner || match.status === 'scheduled' ? 'bg-cyan/35' : 'bg-cyan/10'
                        }`}
                      />
                    )}

                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BracketView
