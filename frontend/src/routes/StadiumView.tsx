import React, { useState, useEffect } from 'react'
import { 
  ShieldAlert, 
  DoorOpen, 
  DoorClosed, 
  Map, 
  Layers, 
  AlertTriangle 
} from 'lucide-react'
import { useOperations } from '@/hooks/useOperations'
import type { StandSection } from '@/types/operations'
import Panel from '@/components/design-system/Panel'
import DataLabel from '@/components/design-system/DataLabel'
import StatusPill from '@/components/design-system/StatusPill'
import Button from '@/components/design-system/Button'
import StadiumInteractive3D from '@/components/stadium/StadiumInteractive3D'
import StadiumInteractive2D from '@/components/stadium/StadiumInteractive2D'

export const StadiumView: React.FC = () => {
  const { sections, toggleGate, clearIncidents, canMutate } = useOperations()
  const [selectedSection, setSelectedSection] = useState<StandSection | null>(null)
  const [cameraPreset, setCameraPreset] = useState<'overview' | 'pitch' | 'north'>('overview')
  const [isSimplified, setIsSimplified] = useState<boolean>(false)

  // Derive the current state of the selected section from operations context to keep it in sync
  const currentSection = selectedSection 
    ? sections.find(s => s.id === selectedSection.id) || null 
    : null

  // Hardware concurrency check on mount to auto-trigger Simplified View on low-end systems
  useEffect(() => {
    const cores = navigator.hardwareConcurrency || 4
    if (cores < 4) {
      setIsSimplified(true)
    }
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto pb-12 items-stretch min-h-[500px]">
      
      {/* Left/Main Column: 3D Canvas / 2D Diagram */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        
        {/* Canvas Toolbar Control Panel */}
        <Panel className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
          {/* Preset Buttons - Hidden in 2D Simplified Mode */}
          <div className="flex items-center gap-2">
            {!isSimplified ? (
              <>
                <DataLabel className="mr-1">VIEWPORT PRESETS:</DataLabel>
                <Button 
                  variant={cameraPreset === 'overview' ? 'primary' : 'secondary'} 
                  onClick={() => setCameraPreset('overview')}
                  className="py-1 px-2.5 text-[9px] font-mono h-7"
                >
                  OVERVIEW
                </Button>
                <Button 
                  variant={cameraPreset === 'pitch' ? 'primary' : 'secondary'} 
                  onClick={() => setCameraPreset('pitch')}
                  className="py-1 px-2.5 text-[9px] font-mono h-7"
                >
                  PITCH LEVEL
                </Button>
                <Button 
                  variant={cameraPreset === 'north' ? 'primary' : 'secondary'} 
                  onClick={() => setCameraPreset('north')}
                  className="py-1 px-2.5 text-[9px] font-mono h-7"
                >
                  NORTH STAND
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-cyan font-mono text-[10px] uppercase">
                <Map size={12} />
                <span>2D Vector Blueprint Mode Active</span>
              </div>
            )}
          </div>

          {/* 3D/2D Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsSimplified(prev => !prev)}
              aria-label="Toggle between 3D visual stadium and accessible 2D vector blueprint"
              aria-pressed={isSimplified}
              className="py-1 px-2.5 text-[9px] font-mono h-7 flex items-center gap-1.5"
            >
              <Layers size={11} />
              <span>{isSimplified ? 'ACTIVATE 3D VIEW' : 'ACTIVATE 2D BLUEPRINT'}</span>
            </Button>
          </div>
        </Panel>

        {/* Dynamic Stadium Viewport */}
        <div className="flex-grow min-h-[380px] lg:min-h-[440px] flex">
          {isSimplified ? (
            <StadiumInteractive2D
              sections={sections}
              selectedSectionId={selectedSection?.id || null}
              onSelectSection={setSelectedSection}
            />
          ) : (
            <StadiumInteractive3D
              sections={sections}
              selectedSectionId={selectedSection?.id || null}
              onSelectSection={setSelectedSection}
              cameraPreset={cameraPreset}
            />
          )}
        </div>

      </div>

      {/* Right Column: Seating Sector Details Side Panel */}
      <div className="lg:col-span-1 flex">
        <Panel className="w-full flex flex-col justify-between h-full min-h-[380px]">
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
