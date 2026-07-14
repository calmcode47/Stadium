import React from 'react'
import type { BracketMatch } from '@/types/operations'
import Panel from '@/components/design-system/Panel'
import DataLabel from '@/components/design-system/DataLabel'
import StatusPill from '@/components/design-system/StatusPill'

interface ScheduleViewProps {
  matches: BracketMatch[]
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ matches }) => {
  // Group matches by date
  const groupedMatches = matches.reduce((acc, curr) => {
    if (!acc[curr.date]) {
      acc[curr.date] = []
    }
    acc[curr.date].push(curr)
    return acc
  }, {} as Record<string, BracketMatch[]>)

  // Sort dates chronologically (our mock dates are simple e.g. "JULY 08", "JULY 09", "JULY 11", "JULY 14")
  const sortedDates = Object.keys(groupedMatches).sort((a, b) => {
    const dayA = parseInt(a.replace(/\D/g, '')) || 0
    const dayB = parseInt(b.replace(/\D/g, '')) || 0
    return dayA - dayB
  })

  return (
    <Panel className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-cyan/15 pb-2">
        <DataLabel>CHRONOLOGICAL RUN-SHEET PROTOCOL</DataLabel>
        <span className="font-mono text-[9px] text-text-muted uppercase">
          {matches.length} REGISTRY ENTRIES
        </span>
      </div>

      <div className="flex flex-col gap-6">
        {sortedDates.map((date) => (
          <div key={date} className="flex flex-col gap-2">
            {/* Day Header Label */}
            <div className="border-b border-cyan/5 pb-1 mb-1 mt-1">
              <DataLabel className="text-cyan text-[10px] tracking-widest">
                TIMELINE INDEX // {date}
              </DataLabel>
            </div>

            {/* List of Matches on this Day */}
            <div className="flex flex-col gap-1.5">
              {groupedMatches[date]
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((match) => (
                  <div
                    key={match.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-elevated/25 border border-cyan/5 hover:border-cyan/20 transition-colors duration-150 rounded-[2px] font-mono text-xs gap-2"
                  >
                    {/* Time & Competitor Teams */}
                    <div className="flex items-center gap-4">
                      <span className="text-cyan font-semibold w-12 tracking-wide shrink-0">
                        {match.time}
                      </span>
                      <span className="text-text-primary text-[11px] font-medium tracking-wide">
                        {match.teamHome} <span className="text-text-muted text-[10px]">VS</span> {match.teamAway}
                      </span>
                    </div>

                    {/* Venue & Status */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <span className="text-text-muted text-[10px] uppercase tracking-wider">
                        {match.venue}
                      </span>
                      <StatusPill variant={match.status} />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

export default ScheduleView
