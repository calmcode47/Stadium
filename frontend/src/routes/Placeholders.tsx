import React from 'react'
import Panel from '@/components/design-system/Panel'
import DataLabel from '@/components/design-system/DataLabel'
import StatusPill from '@/components/design-system/StatusPill'
import Button from '@/components/design-system/Button'

// Page Wrapper to give all placeholder pages a consistent modern operations vibe
const PageWrapper: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-cyan/15 pb-4 mb-2">
        <div>
          <DataLabel className="text-cyan">SYSTEM NODE // ACTIVE</DataLabel>
          <h2 className="text-2xl font-display uppercase tracking-wider text-text-primary mt-0.5">{title}</h2>
        </div>
        <StatusPill variant="live" />
      </div>
      {children}
    </div>
  )
}

export const OverviewPlaceholder: React.FC = () => {
  return (
    <PageWrapper title="Venue Landing & Overview">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Panel className="flex flex-col gap-4">
          <DataLabel>STADIUM GATEWAY STATUS</DataLabel>
          <p className="text-xs font-mono text-text-muted leading-relaxed">
            Central operational overview hub. Gate status, tournament progression, and live feed tickers will render here in Phase 2.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary">ACCESS GATE SECTORS</Button>
          </div>
        </Panel>
        <Panel className="flex flex-col gap-4">
          <DataLabel>SYSTEM PERFORMANCE</DataLabel>
          <div className="flex justify-between items-center text-xs font-mono border-b border-cyan/10 pb-2">
            <span className="text-text-muted">SOCKET CONN:</span>
            <span className="text-success font-semibold">SECURE</span>
          </div>
          <div className="flex justify-between items-center text-xs font-mono border-b border-cyan/10 pb-2">
            <span className="text-text-muted">RENDER THREAD:</span>
            <span className="text-cyan">60 FPS</span>
          </div>
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-text-muted">3D RENDERING NODE:</span>
            <span className="text-cyan">ACTIVE</span>
          </div>
        </Panel>
      </div>
    </PageWrapper>
  )
}

export const DashboardPlaceholder: React.FC = () => {
  return (
    <PageWrapper title="Live Operations Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Panel className="lg:col-span-2 flex flex-col gap-4">
          <DataLabel>CRITICAL ALERT BOARD</DataLabel>
          <div className="bg-danger/10 border border-danger p-3 text-xs font-mono text-danger flex items-center justify-between">
            <span>ALERT // SECTOR G4 PRESSURE EXCESS DETECTED</span>
            <Button variant="ghost" className="text-danger hover:bg-danger/10 px-2 py-1">ACKNOWLEDGE</Button>
          </div>
          <p className="text-xs font-mono text-text-muted">
            Live sensor data, referee status feeds, and stadium telemetry streams will display here in Phase 3.
          </p>
        </Panel>
        <Panel className="flex flex-col gap-4">
          <DataLabel>QUICK CONTROL ACTION</DataLabel>
          <Button variant="primary" className="w-full">PAUSE STADIUM INTAKE</Button>
          <Button variant="secondary" className="w-full">BROADCAST ALARM</Button>
        </Panel>
      </div>
    </PageWrapper>
  )
}

export const StadiumPlaceholder: React.FC = () => {
  return (
    <PageWrapper title="3D Interactive Stadium View">
      <Panel className="flex flex-col gap-6 items-center justify-center min-h-[350px] border-dashed border-cyan/30 bg-surface/50">
        <div className="text-center max-w-md">
          <DataLabel className="text-cyan text-sm tracking-widest block mb-2">3D CANVAS OFFLINE</DataLabel>
          <p className="text-xs font-mono text-text-muted leading-relaxed mb-4">
            WebGL / React Three Fiber interactive context placeholder. In Phase 4, this container will load a responsive 3D model of the venue allowing live gate selection and seat tracking.
          </p>
          <Button variant="secondary">LOAD WEBGLEngine</Button>
        </div>
      </Panel>
    </PageWrapper>
  )
}

export const TournamentsPlaceholder: React.FC = () => {
  return (
    <PageWrapper title="Tournament Bracket & Scheduling">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Panel className="flex flex-col gap-4">
          <DataLabel>CURRENT BRACKET: CHAMPIONS LEAGUE</DataLabel>
          <div className="p-3 bg-elevated border border-cyan/15 rounded-[2px] font-mono text-xs text-text-muted flex justify-between items-center">
            <span>QUARTERFINAL 01</span>
            <StatusPill variant="completed" />
          </div>
          <div className="p-3 bg-elevated border border-cyan/15 rounded-[2px] font-mono text-xs text-text-muted flex justify-between items-center">
            <span>QUARTERFINAL 02</span>
            <StatusPill variant="live" />
          </div>
          <div className="p-3 bg-elevated border border-cyan/15 rounded-[2px] font-mono text-xs text-text-muted flex justify-between items-center">
            <span>QUARTERFINAL 03</span>
            <StatusPill variant="scheduled" />
          </div>
          <p className="text-xs font-mono text-text-muted">
            Tournament node tree, matches, scheduler, and bracket layout will be created in Phase 5.
          </p>
        </Panel>
        <Panel className="flex flex-col gap-4">
          <DataLabel>SCHEDULING OPTIONS</DataLabel>
          <Button variant="secondary" className="w-full">CREATE NEW BRACKET</Button>
          <Button variant="ghost" className="w-full">REFRESH TOURNAMENT SCHEDULER</Button>
        </Panel>
      </div>
    </PageWrapper>
  )
}

export const LiveFeedPlaceholder: React.FC = () => {
  return (
    <PageWrapper title="Live Match Feed">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Panel className="md:col-span-2 flex flex-col gap-4">
          <DataLabel>MATCH DATA TELEMETRY</DataLabel>
          <div className="border border-cyan/10 p-3 flex flex-col gap-2 font-mono text-xs bg-elevated/40">
            <div className="flex justify-between">
              <span className="text-text-muted">14:02:11 - FOUL COMMITTED:</span>
              <span className="text-amber">PLAYER 7 (HOME)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">14:00:45 - GOAL SCORED:</span>
              <span className="text-success font-semibold">HOME TEAM [1 - 0]</span>
            </div>
          </div>
          <p className="text-xs font-mono text-text-muted">
            Real-time soccer/football match feed, details, referee inputs, and status timeline will render here in Phase 6.
          </p>
        </Panel>
        <Panel className="flex flex-col gap-4">
          <DataLabel>LIVE EVENT ACTIONS</DataLabel>
          <Button variant="secondary" className="w-full">PAUSE LIVE CLOCK</Button>
          <Button variant="primary" className="w-full">TRIGGER EVENT OVERRIDE</Button>
        </Panel>
      </div>
    </PageWrapper>
  )
}
