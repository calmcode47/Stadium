import React from 'react'
import type { Tournament } from '@/types/operations'
import Panel from '@/components/design-system/Panel'
import DataLabel from '@/components/design-system/DataLabel'

interface TournamentProgressPanelProps {
  tournament: Tournament
}

export const TournamentProgressPanel: React.FC<TournamentProgressPanelProps> = ({ tournament }) => {
  const { name, stage, completedMatches, totalMatches } = tournament

  // Create segments array
  const segments = Array.from({ length: totalMatches })

  return (
    <Panel className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-cyan/15 pb-2">
        <DataLabel>TOURNAMENT SCHEDULING MATRIX</DataLabel>
      </div>

      <div className="flex flex-col gap-3">
        {/* Stage details */}
        <div className="flex justify-between items-baseline font-mono">
          <div className="flex flex-col">
            <span className="text-xs text-text-primary font-medium tracking-wide uppercase">
              {name}
            </span>
            <span className="text-[10px] text-text-muted mt-0.5">
              STAGE: {stage}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-cyan font-bold">
              {completedMatches} / {totalMatches}
            </span>
            <span className="text-[10px] text-text-muted block mt-0.5">
              MATCHES COMPLETE
            </span>
          </div>
        </div>

        {/* Segmented rectangular progress bar */}
        <div className="flex items-center gap-1.5 w-full select-none" role="progressbar" aria-valuenow={completedMatches} aria-valuemin={0} aria-valuemax={totalMatches}>
          {segments.map((_, idx) => {
            const isCompleted = idx < completedMatches
            return (
              <div
                key={idx}
                className={`flex-1 h-3 transition-colors duration-500 rounded-none border ${
                  isCompleted
                    ? 'bg-cyan border-cyan'
                    : 'bg-transparent border-cyan/15'
                }`}
              />
            )
          })}
        </div>
        
        {/* Telemetry bottom line */}
        <div className="flex justify-between text-[9px] font-mono text-text-muted mt-1 uppercase">
          <span>NEXT: SEMIFINAL DRAFT</span>
          <span>EST COMPLETION: 23:30</span>
        </div>
      </div>
    </Panel>
  )
}

export default TournamentProgressPanel
