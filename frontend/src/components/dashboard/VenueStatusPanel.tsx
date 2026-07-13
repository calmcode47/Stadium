import React from 'react'
import type { VenueZone } from '@/types/operations'
import Panel from '@/components/design-system/Panel'
import DataLabel from '@/components/design-system/DataLabel'
import StatusPill from '@/components/design-system/StatusPill'

interface VenueStatusPanelProps {
  zones: VenueZone[]
}

export const VenueStatusPanel: React.FC<VenueStatusPanelProps> = React.memo(({ zones }) => {
  return (
    <Panel className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-cyan/15 pb-2">
        <DataLabel>VENUE SECTOR CAPACITY METRIC</DataLabel>
      </div>

      <div className="flex flex-col gap-4">
        {zones.map((zone) => {
          const percent = Math.min(100, Math.round((zone.occupancy / zone.maxCapacity) * 100))
          
          // Color bar indicator depending on stress level
          const meterColor = percent > 95 
            ? 'bg-danger' 
            : percent > 80 
              ? 'bg-amber' 
              : 'bg-cyan'

          return (
            <div key={zone.name} className="flex flex-col gap-1">
              {/* Header metrics row */}
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-text-primary font-medium tracking-wide">{zone.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-text-muted text-[10px]">
                    {zone.occupancy.toLocaleString()} / {zone.maxCapacity.toLocaleString()} ({percent}%)
                  </span>
                  <StatusPill variant={zone.status} className="scale-90 origin-right" />
                </div>
              </div>

              {/* Sharp rectangular bar meter */}
              <div className="w-full bg-base border border-cyan/15 h-3.5 p-0.5 rounded-none overflow-hidden select-none">
                <div
                  className={`h-full transition-all duration-700 ease-out rounded-none ${meterColor}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
})

export default VenueStatusPanel
