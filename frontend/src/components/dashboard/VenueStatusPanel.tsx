import React from 'react'
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check.mjs'
import TriangleAlert from 'lucide-react/dist/esm/icons/triangle-alert.mjs'
import OctagonAlert from 'lucide-react/dist/esm/icons/octagon-alert.mjs'
import type { VenueZone } from '@/types/operations'
import Panel from '@/components/design-system/Panel'
import DataLabel from '@/components/design-system/DataLabel'
import StatusPill from '@/components/design-system/StatusPill'

interface VenueStatusPanelProps {
  zones: VenueZone[]
}

type OccupancyIcon = React.ComponentType<{ size?: number | string; className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>

const occupancyLabel = (percent: number): { text: string; className: string; Icon: OccupancyIcon } => {
  if (percent > 95) return { text: 'CRITICAL', className: 'text-danger', Icon: OctagonAlert }
  if (percent > 80) return { text: 'ELEVATED', className: 'text-amber', Icon: TriangleAlert }
  return { text: 'NOMINAL', className: 'text-cyan', Icon: ShieldCheck }
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
          const level = occupancyLabel(percent)
          const LevelIcon = level.Icon
          
          // Color bar indicator depending on stress level
          const meterColor = percent > 95 
            ? 'bg-danger' 
            : percent > 80 
              ? 'bg-amber' 
              : 'bg-cyan'

          return (
            <div key={zone.name} className="flex flex-col gap-1">
              {/* Header metrics row — wraps under text zoom so labels don't clip */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className="text-text-primary font-medium tracking-wide break-words">{zone.name}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase ${level.className}`}>
                    <LevelIcon size={10} className="shrink-0" aria-hidden="true" />
                    {level.text}
                  </span>
                  <span className="text-text-muted text-[10px]">
                    {zone.occupancy.toLocaleString()} / {zone.maxCapacity.toLocaleString()} ({percent}%)
                  </span>
                  <StatusPill variant={zone.status} />
                </div>
              </div>

              {/* Sharp rectangular bar meter — length + label encode level, not color alone */}
              <div
                className="w-full bg-base border border-cyan/15 h-3.5 p-0.5 rounded-none overflow-hidden select-none"
                role="meter"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${zone.name} occupancy ${level.text} ${percent}%`}
              >
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
