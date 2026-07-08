import React, { useState } from 'react'
import Panel from '@/components/design-system/Panel'
import DataLabel from '@/components/design-system/DataLabel'
import ScoreDigit from '@/components/design-system/ScoreDigit'
import StatusPill from '@/components/design-system/StatusPill'
import Button from '@/components/design-system/Button'

export const DesignSystemPreview: React.FC = () => {
  // Score state for demonstrating key-remount flash animation
  const [homeScore, setHomeScore] = useState(2)
  const [awayScore, setAwayScore] = useState(1)

  // Simulation states
  const [gate4Open, setGate4Open] = useState(true)
  const [radarPing, setRadarPing] = useState(true)

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-8">
      
      {/* Sub-header Controls */}
      <div className="border-b border-cyan/15 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <DataLabel className="text-cyan">STADIUM OPS CONTROL // DESIGN PREVIEW</DataLabel>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="secondary" 
            onClick={() => setRadarPing(prev => !prev)}
          >
            {radarPing ? 'DISABLE MONITOR' : 'ENABLE MONITOR'}
          </Button>
          <Button variant="primary">SYS OVERRIDE</Button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        
        {/* Left Column: Core Panel Primitives & Status Pills */}
        <section className="flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-display text-text-primary uppercase tracking-wide mb-3 border-l-2 border-cyan pl-2">
              Panels & Status Primitives
            </h2>
            <p className="text-text-muted text-xs font-mono mb-4">
              Primitives demonstrating border-cyan/20, sharp borders, and square status indicators.
            </p>
          </div>

          <Panel className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <DataLabel>PANEL CONSTANT</DataLabel>
              <StatusPill variant="scheduled" />
            </div>
            <div className="text-xs font-mono text-text-muted leading-relaxed">
              Standard module wrapper. Rounded corners are capped strictly at 4px. Borders feature high-transparency cyan lines for a virtual grid display.
            </div>
            <div className="flex justify-between items-center text-xs font-mono border-t border-cyan/10 pt-2 mt-2">
              <span className="text-text-muted">HOST ID:</span>
              <span className="text-cyan">SRV-NODE-01</span>
            </div>
          </Panel>

          <Panel live={radarPing} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <DataLabel className="text-cyan">LIVE TELEMETRY PANEL</DataLabel>
              <StatusPill variant="live" />
            </div>
            <div className="text-xs font-mono text-text-muted leading-relaxed">
              Pulsing cyan indicator in the top right denotes live socket data updates. Active animations respect prefers-reduced-motion media query restrictions.
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono border-t border-cyan/10 pt-2 mt-2">
              <div>
                <span className="text-text-muted">GATEWAY:</span> <span className="text-cyan">ONLINE</span>
              </div>
              <div>
                <span className="text-text-muted">LATENCY:</span> <span className="text-amber">14MS</span>
              </div>
            </div>
          </Panel>

          <Panel className="flex flex-col gap-3">
            <DataLabel>STATUS LABELS CATALOG</DataLabel>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5 p-2 bg-base/50 border border-cyan/5">
                <DataLabel className="text-[10px] text-text-muted">VARIANT LIVE</DataLabel>
                <div><StatusPill variant="live" /></div>
              </div>
              <div className="flex flex-col gap-1.5 p-2 bg-base/50 border border-cyan/5">
                <DataLabel className="text-[10px] text-text-muted">VARIANT SCHEDULED</DataLabel>
                <div><StatusPill variant="scheduled" /></div>
              </div>
              <div className="flex flex-col gap-1.5 p-2 bg-base/50 border border-cyan/5">
                <DataLabel className="text-[10px] text-text-muted">VARIANT COMPLETED</DataLabel>
                <div><StatusPill variant="completed" /></div>
              </div>
              <div className="flex flex-col gap-1.5 p-2 bg-base/50 border border-cyan/5">
                <DataLabel className="text-[10px] text-text-muted">VARIANT DELAYED</DataLabel>
                <div><StatusPill variant="delayed" /></div>
              </div>
              <div className="flex flex-col gap-1.5 p-2 bg-base/50 border border-cyan/5">
                <DataLabel className="text-[10px] text-text-muted">VARIANT CANCELLED</DataLabel>
                <div><StatusPill variant="cancelled" /></div>
              </div>
            </div>
          </Panel>
        </section>

        {/* Middle Column: Score Displays & ScoreDigit Key Remount */}
        <section className="flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-display text-text-primary uppercase tracking-wide mb-3 border-l-2 border-amber pl-2">
              Score & Numerals Engine
            </h2>
            <p className="text-text-muted text-xs font-mono mb-4">
              Bebas Neue score displays supporting an instantaneous update glow/flash animation on change.
            </p>
          </div>

          <Panel className="flex flex-col items-center justify-between text-center min-h-[300px] justify-center gap-6">
            <div className="flex flex-col items-center">
              <DataLabel className="mb-2">CURRENT MATCH SCORE</DataLabel>
              <StatusPill variant="live" />
            </div>

            {/* Score Numbers Frame */}
            <div className="flex items-center justify-center gap-8 my-4 select-none">
              <div className="flex flex-col items-center">
                <DataLabel className="text-[10px] text-text-muted mb-1">HOME</DataLabel>
                <div style={{ fontSize: '7rem' }}>
                  <ScoreDigit value={homeScore} colorVariant="cyan" />
                </div>
              </div>
              <div className="font-display text-5xl text-text-muted self-center mt-6">:</div>
              <div className="flex flex-col items-center">
                <DataLabel className="text-[10px] text-text-muted mb-1">AWAY</DataLabel>
                <div style={{ fontSize: '7rem' }}>
                  <ScoreDigit value={awayScore} colorVariant="amber" />
                </div>
              </div>
            </div>

            {/* Simulated Scoring Controls */}
            <div className="flex flex-col gap-2 w-full mt-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <Button 
                    variant="secondary" 
                    onClick={() => setHomeScore(prev => prev + 1)}
                  >
                    HOME +
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setHomeScore(prev => Math.max(0, prev - 1))}
                  >
                    HOME -
                  </Button>
                </div>
                <div className="flex flex-col gap-1">
                  <Button 
                    variant="secondary" 
                    onClick={() => setAwayScore(prev => prev + 1)}
                  >
                    AWAY +
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setAwayScore(prev => Math.max(0, prev - 1))}
                  >
                    AWAY -
                  </Button>
                </div>
              </div>
              <DataLabel className="text-[9px] text-text-muted text-center mt-1">
                Click controls to trigger Framer Motion key-remount glow flashes.
              </DataLabel>
            </div>
          </Panel>

          <Panel className="flex flex-col gap-3">
            <DataLabel>MISCELLANEOUS COUNTERS</DataLabel>
            <div className="flex justify-around items-center py-2">
              <div className="text-center">
                <DataLabel className="block text-[10px]">PITCH TEMP</DataLabel>
                <span className="text-3xl font-display text-primary block mt-1">
                  <ScoreDigit value={22} colorVariant="primary" />°C
                </span>
              </div>
              <div className="w-px h-10 bg-cyan/15"></div>
              <div className="text-center">
                <DataLabel className="block text-[10px]">HUMIDITY</DataLabel>
                <span className="text-3xl font-display text-primary block mt-1">
                  <ScoreDigit value={68} colorVariant="primary" />%
                </span>
              </div>
              <div className="w-px h-10 bg-cyan/15"></div>
              <div className="text-center">
                <DataLabel className="block text-[10px]">WIND SPD</DataLabel>
                <span className="text-3xl font-display text-primary block mt-1">
                  <ScoreDigit value={12} colorVariant="primary" /> KM/H
                </span>
              </div>
            </div>
          </Panel>
        </section>

        {/* Right Column: Gate Operational Controls & Actions */}
        <section className="flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-display text-text-primary uppercase tracking-wide mb-3 border-l-2 border-cyan pl-2">
              Action & Security Center
            </h2>
            <p className="text-text-muted text-xs font-mono mb-4">
              Operational toggle actions, accessibility validation, and button states.
            </p>
          </div>

          <Panel className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <DataLabel>GATE 04 PERIMETER</DataLabel>
              <StatusPill variant={gate4Open ? 'completed' : 'cancelled'} />
            </div>

            <div className="text-xs font-mono text-text-muted">
              Current state: <span className={gate4Open ? 'text-success font-semibold' : 'text-danger font-semibold'}>{gate4Open ? 'SECURE / ENTRANCE OPEN' : 'LOCKED / ENTRANCE CLOSED'}</span>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <Button 
                variant="primary" 
                onClick={() => setGate4Open(prev => !prev)}
              >
                TOGGLE GATE 04 STATUS
              </Button>
            </div>
          </Panel>

          <Panel className="flex flex-col gap-4">
            <DataLabel>BUTTON VARIATIONS</DataLabel>
            
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <DataLabel className="text-[9px]">PRIMARY VARIANT</DataLabel>
                <Button variant="primary">PRIMARY ACTION</Button>
              </div>
              
              <div className="flex flex-col gap-1">
                <DataLabel className="text-[9px]">SECONDARY VARIANT</DataLabel>
                <Button variant="secondary">SECONDARY SHIELD</Button>
              </div>
              
              <div className="flex flex-col gap-1">
                <DataLabel className="text-[9px]">GHOST VARIANT</DataLabel>
                <Button variant="ghost">GHOST LOGOUT</Button>
              </div>

              <div className="flex flex-col gap-1">
                <DataLabel className="text-[9px]">DISABLED STATE</DataLabel>
                <Button variant="primary" disabled className="opacity-40 cursor-not-allowed hover:bg-cyan hover:text-base">
                  SYSTEM LOCKED
                </Button>
              </div>
            </div>
          </Panel>

          <Panel className="flex flex-col gap-3 text-xs font-mono text-text-muted">
            <DataLabel>ACCESSIBILITY RING CHECK</DataLabel>
            <p>
              Use the <kbd className="bg-elevated px-1.5 py-0.5 border border-cyan/15 rounded text-cyan">Tab</kbd> key to navigate between actions. A thick custom solid cyan focus border will replace the default browser focus outline, retaining full visual utility for keyboard operators.
            </p>
          </Panel>
        </section>

      </main>

      {/* Footer System Log */}
      <footer className="mt-12 text-center text-[10px] font-mono text-text-muted border-t border-cyan/10 pt-4">
        STADIUMOPS TERMINAL // BUILD 1.0.0 // NO EMOJI IN INTERACTION NODES // VERIFY STACK COMPLETE
      </footer>
    </div>
  )
}

export default DesignSystemPreview
