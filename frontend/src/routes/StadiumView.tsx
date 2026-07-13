import React, { Suspense, useMemo, useState } from 'react'
import ShieldAlert from 'lucide-react/dist/esm/icons/shield-alert.mjs'
import DoorOpen from 'lucide-react/dist/esm/icons/door-open.mjs'
import DoorClosed from 'lucide-react/dist/esm/icons/door-closed.mjs'
import Map from 'lucide-react/dist/esm/icons/map.mjs'
import Layers from 'lucide-react/dist/esm/icons/layers.mjs'
import AlertTriangle from 'lucide-react/dist/esm/icons/triangle-alert.mjs'
import { useOperations } from '@/hooks/useOperations'
import type { StandSection } from '@/types/operations'
import Panel from '@/components/design-system/Panel'
import DataLabel from '@/components/design-system/DataLabel'
import StatusPill from '@/components/design-system/StatusPill'
import Button from '@/components/design-system/Button'
import StadiumInteractive2D from '@/components/stadium/StadiumInteractive2D'

const StadiumInteractive3D = React.lazy(() => import('@/components/stadium/StadiumInteractive3D'))

const StadiumSceneFallback: React.FC = () => (
  <Panel className="w-full h-full flex flex-col justify-between p-4 bg-surface/80 border-cyan/20 animate-pulse">
    <div className="flex items-center justify-between border-b border-cyan/10 pb-3">
      <DataLabel className="text-cyan">LOADING 3D SECTOR MODEL</DataLabel>
      <div className="h-5 w-20 bg-cyan/10 border border-cyan/10 rounded-none" />
    </div>
    <div className="flex-1 flex items-center justify-center">
      <div className="w-56 h-56 border border-dashed border-cyan/15 rounded-full flex items-center justify-center">
        <div className="w-36 h-36 border border-dashed border-cyan/10 rounded-full" />
      </div>
    </div>
    <div className="h-2 w-48 bg-cyan/10 rounded-none self-center" />
  </Panel>
)

export const StadiumView: React.FC = () => {
  const { sections, toggleGate, clearIncidents, canMutate } = useOperations()
  const [selectedSection, setSelectedSection] = useState<StandSection | null>(null)
  const [cameraPreset, setCameraPreset] = useState<'overview' | 'pitch' | 'north'>('overview')
  const [isSimplified, setIsSimplified] = useState<boolean>(() => (navigator.hardwareConcurrency || 4) < 4)

  // Derive the current state of the selected section from operations context to keep it in sync
  const currentSection = useMemo(
    () => (selectedSection ? sections.find(s => s.id === selectedSection.id) || null : null),
    [sections, selectedSection]
  )

  return (
    <div className="w-full h-full lg:relative flex flex-col lg:block select-none overflow-y-auto lg:overflow-hidden p-4 lg:p-0 gap-4">
      
      {/* 3D/2D Viewport Container (Takes full parent height/width on desktop, and fixed height on mobile) */}
      <div className="w-full h-[400px] sm:h-[480px] lg:h-full lg:absolute lg:inset-0 lg:z-0 lg:pr-[336px]">
        {isSimplified ? (
          <StadiumInteractive2D
            sections={sections}
            selectedSectionId={selectedSection?.id || null}
            onSelectSection={setSelectedSection}
          />
        ) : (
          <Suspense fallback={<StadiumSceneFallback />}>
            <StadiumInteractive3D
              sections={sections}
              selectedSectionId={selectedSection?.id || null}
              onSelectSection={setSelectedSection}
              cameraPreset={cameraPreset}
            />
          </Suspense>
        )}
      </div>

      {/* Floating HUD: Toolbar Control Panel */}
      <div className="w-full lg:absolute lg:top-4 lg:left-4 lg:w-auto lg:z-10 pointer-events-none">
        <Panel className="pointer-events-auto bg-surface/85 backdrop-blur-md border border-cyan/25 py-2 px-3 flex flex-wrap items-center gap-3 rounded-none shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          {/* Preset Buttons - Hidden in 2D Simplified Mode */}
          <div className="flex items-center gap-2">
            {!isSimplified ? (
              <>
                <DataLabel className="mr-1 text-[9px]">PRESETS:</DataLabel>
                <Button 
                  variant={cameraPreset === 'overview' ? 'primary' : 'secondary'} 
                  onClick={() => setCameraPreset('overview')}
                  className="py-1 px-2.5 text-[8px] font-mono h-6 flex items-center justify-center"
                >
                  OVERVIEW
                </Button>
                <Button 
                  variant={cameraPreset === 'pitch' ? 'primary' : 'secondary'} 
                  onClick={() => setCameraPreset('pitch')}
                  className="py-1 px-2.5 text-[8px] font-mono h-6 flex items-center justify-center"
                >
                  PITCH
                </Button>
                <Button 
                  variant={cameraPreset === 'north' ? 'primary' : 'secondary'} 
                  onClick={() => setCameraPreset('north')}
                  className="py-1 px-2.5 text-[8px] font-mono h-6 flex items-center justify-center"
                >
                  NORTH
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-cyan font-mono text-[9px] uppercase tracking-wider">
                <Map size={10} />
                <span>2D Blueprint Mode</span>
              </div>
            )}
          </div>

          <div className="hidden sm:block w-[1px] h-4 bg-cyan/15 self-stretch" />

          {/* 3D/2D Mode Toggle */}
          <Button
            variant="secondary"
            onClick={() => setIsSimplified(prev => !prev)}
            aria-label="Toggle between 3D visual stadium and accessible 2D vector blueprint"
            aria-pressed={isSimplified}
            className="py-1 px-2.5 text-[8px] font-mono h-6 flex items-center gap-1.5 justify-center"
          >
            <Layers size={10} />
            <span>{isSimplified ? '3D VIEW' : '2D VIEW'}</span>
          </Button>
        </Panel>
      </div>

      {/* Floating HUD: Seating Sector Details Side Panel */}
      <div className="w-full lg:absolute lg:right-4 lg:top-4 lg:bottom-4 lg:w-[320px] lg:z-10 pointer-events-none flex">
        <Panel className="pointer-events-auto w-full bg-surface/85 backdrop-blur-md border border-cyan/25 flex flex-col justify-between h-full p-4 shadow-[0_0_25px_rgba(0,0,0,0.6)]">
          {currentSection ? (
            <div className="flex flex-col gap-5 h-full">
              
              {/* Header section */}
              <div className="border-b border-cyan/15 pb-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <DataLabel className="text-cyan">SECTOR ANALYTICS</DataLabel>
                  <StatusPill variant={currentSection.gateStatus === 'open' ? 'completed' : 'cancelled'} />
                </div>
                <h3 className="text-xl font-display text-text-primary uppercase tracking-wider mt-1">
                  {currentSection.name}
                </h3>
              </div>

              {/* Occupancy bar indicator */}
              <div className="flex flex-col gap-1.5 font-mono text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="text-text-muted">OCCUPANCY STATUS:</span>
                  <span className="text-text-primary font-bold">
                    {currentSection.occupancy.toLocaleString()} / {currentSection.maxCapacity.toLocaleString()} ({Math.round(currentSection.occupancy / currentSection.maxCapacity * 100)}%)
                  </span>
                </div>
                
                {/* Rectangular progress bar fill */}
                <div className="w-full bg-base border border-cyan/15 h-4 p-0.5 rounded-none overflow-hidden">
                  <div
                    className={`h-full rounded-none transition-all duration-500 ${
                      (currentSection.occupancy / currentSection.maxCapacity) > 0.9
                        ? 'bg-danger'
                        : (currentSection.occupancy / currentSection.maxCapacity) > 0.8
                          ? 'bg-amber'
                          : 'bg-cyan'
                    }`}
                    style={{ width: `${(currentSection.occupancy / currentSection.maxCapacity) * 100}%` }}
                  />
                </div>
              </div>

              {/* Detail fields table */}
              <div className="flex flex-col gap-2.5 font-mono text-xs mt-2">
                <div className="flex justify-between items-center border-b border-cyan/10 pb-2">
                  <span className="text-text-muted">GATE STATUS:</span>
                  <span className="flex items-center gap-1">
                    {currentSection.gateStatus === 'open' ? (
                      <>
                        <DoorOpen size={12} className="text-success" />
                        <span className="text-success font-semibold">GATES UNLOCKED</span>
                      </>
                    ) : (
                      <>
                        <DoorClosed size={12} className="text-danger" />
                        <span className="text-danger font-semibold">GATES LOCKDOWN</span>
                      </>
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between items-center border-b border-cyan/10 pb-2">
                  <span className="text-text-muted">INCIDENT LOGS:</span>
                  <span className="flex items-center gap-1.5">
                    {currentSection.incidents > 0 ? (
                      <>
                        <ShieldAlert size={12} className="text-danger animate-pulse" />
                        <span className="text-danger font-bold">{currentSection.incidents} ACTIVE</span>
                      </>
                    ) : (
                      <>
                        <span className="text-success font-semibold">NO REPORTED INCIDENTS</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-cyan/10">
                <Button 
                  variant={currentSection.gateStatus === 'open' ? 'secondary' : 'primary'}
                  onClick={() => toggleGate(currentSection.id)}
                  disabled={!canMutate}
                >
                  {currentSection.gateStatus === 'open' ? 'LOCKDOWN ACCESS GATES' : 'UNLOCK ACCESS GATES'}
                </Button>
                {currentSection.incidents > 0 && (
                  <Button 
                    variant="primary" 
                    className="bg-danger text-base border-danger hover:bg-transparent hover:text-danger mt-1"
                    onClick={() => clearIncidents(currentSection.id)}
                    disabled={!canMutate}
                  >
                    RESOLVE ALL INCIDENTS
                  </Button>
                )}
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-cyan/15 rounded-[2px] opacity-75">
              <AlertTriangle size={24} className="text-cyan/60 animate-pulse mb-3" />
              <DataLabel className="block text-cyan tracking-widest mb-1.5">NO SECTOR ENGAGED</DataLabel>
              <p className="font-mono text-[10px] text-text-muted leading-relaxed max-w-[200px]">
                Click on a stand sector in the viewport model to deploy radar scanner.
              </p>
            </div>
          )}
        </Panel>
      </div>

    </div>
  )
}

export default StadiumView
