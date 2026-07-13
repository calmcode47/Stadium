import React from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import Building2 from 'lucide-react/dist/esm/icons/building-2.mjs'
import Activity from 'lucide-react/dist/esm/icons/activity.mjs'
import Settings from 'lucide-react/dist/esm/icons/settings.mjs'
import AlertTriangle from 'lucide-react/dist/esm/icons/triangle-alert.mjs'
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right.mjs'
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up.mjs'
import Cpu from 'lucide-react/dist/esm/icons/cpu.mjs'
import Panel from '@/components/design-system/Panel'
import DataLabel from '@/components/design-system/DataLabel'
import ScoreDigit from '@/components/design-system/ScoreDigit'
import StatusPill from '@/components/design-system/StatusPill'
import Button from '@/components/design-system/Button'

const Stadium3D = React.lazy(() => import('@/components/stadium/Stadium3D'))

const StadiumHeroFallback: React.FC = () => (
  <Panel className="w-full h-full flex flex-col justify-between p-4 animate-pulse">
    <div className="flex justify-between items-center border-b border-cyan/10 pb-2">
      <div className="h-2 w-28 bg-cyan/20 rounded-none" />
      <div className="h-4 w-14 bg-cyan/10 rounded-none" />
    </div>
    <div className="flex-1 flex items-center justify-center">
      <div className="w-44 h-44 border border-dashed border-cyan/15 rounded-full flex items-center justify-center">
        <div className="w-28 h-28 border border-dashed border-cyan/10 rounded-full" />
      </div>
    </div>
    <div className="h-2 w-40 bg-cyan/10 rounded-none self-center" />
  </Panel>
)

export const Overview: React.FC = () => {
  const shouldReduceMotion = useReducedMotion()

  // Motion container variants for neat sequential scroll triggers
  const revealVariants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: shouldReduceMotion ? 0 : 0.45, ease: 'easeOut' as const }
    }
  }

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto pb-12">
      
      {/* 1. Broadcast Hero Section */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealVariants}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
      >
        {/* Left Column: Command details */}
        <div className="lg:col-span-7 flex flex-col justify-between p-4 sm:p-6 md:p-8 bg-surface border border-cyan/20 rounded-[4px] relative overflow-hidden">
          
          {/* Hexagonal grid absolute overlay for premium tech style */}
          <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Cpu size={14} className="text-cyan animate-pulse" />
              <DataLabel className="text-cyan font-bold tracking-widest text-xs">
                OPERATIONAL COMMAND SYSTEM // CORE-NODE-ALPHA
              </DataLabel>
            </div>
            
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-display tracking-wide uppercase text-text-primary leading-tight">
              Smart Stadium <br />
              <span className="text-cyan">Operations Center</span>
            </h1>
            
            <div className="mt-4 font-mono text-[9px] sm:text-xs text-text-muted border-l-2 border-cyan/40 pl-3 sm:pl-4 py-1.5 bg-base/30 max-w-lg break-words">
              SYSTEM STATUS: <span className="text-success font-semibold">NOMINAL</span> // 
              HOST: <span className="text-text-primary">OPS-SRV-MAIN-01</span> // 
              LATENCY: <span className="text-cyan">8MS</span>
            </div>
          </div>

          <div className="mt-8 lg:mt-16 relative z-10 flex flex-col gap-4">
            <p className="text-xs md:text-sm font-mono text-text-muted leading-relaxed max-w-xl">
              Venue gate throughput monitoring, real-time tournament scheduling matrices, and live 3D spectator sector tracking. Authorized stadium personnel only.
            </p>
            <div className="flex flex-wrap gap-3 mt-2">
              <Link to="/dashboard">
                <Button variant="primary" className="flex items-center gap-2">
                  <span>ENTER LIVE CONSOLE</span>
                  <ArrowRight size={14} />
                </Button>
              </Link>
              <Link to="/stadium">
                <Button variant="secondary">STADIUM LAYOUT</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: 3D procedural wireframe moment */}
        <div className="lg:col-span-5 h-[250px] sm:h-[320px] lg:h-auto min-h-[250px] lg:min-h-[350px] flex">
          <React.Suspense fallback={<StadiumHeroFallback />}>
            <Stadium3D />
          </React.Suspense>
        </div>
      </motion.section>

      {/* 2. KPI Summary Panels Row */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Panel className="flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between">
            <DataLabel>ACTIVE MATCHES</DataLabel>
            <Activity size={14} className="text-cyan" />
          </div>
          <div>
            <div className="text-5xl font-display mb-1">
              <ScoreDigit value={4} colorVariant="cyan" />
            </div>
            <span className="font-mono text-[9px] text-text-muted">LIVE BROADCAST CHANNELS</span>
          </div>
        </Panel>

        <Panel className="flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between">
            <DataLabel>VENUES ONLINE</DataLabel>
            <Building2 size={14} className="text-cyan" />
          </div>
          <div>
            <div className="text-5xl font-display mb-1">
              <ScoreDigit value={3} colorVariant="primary" />
            </div>
            <span className="font-mono text-[9px] text-text-muted">CONNECTED PITCH CORES</span>
          </div>
        </Panel>

        <Panel className="flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between">
            <DataLabel>ACTIVE TOURNAMENTS</DataLabel>
            <Settings size={14} className="text-cyan" />
          </div>
          <div>
            <div className="text-5xl font-display mb-1">
              <ScoreDigit value={12} colorVariant="amber" />
            </div>
            <span className="font-mono text-[9px] text-text-muted">BRACKETS PROGRESSING</span>
          </div>
        </Panel>

        <Panel className="flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between">
            <DataLabel>AVG GATE PASS / MIN</DataLabel>
            <TrendingUp size={14} className="text-cyan" />
          </div>
          <div>
            <div className="text-5xl font-display mb-1">
              <ScoreDigit value="8,470" colorVariant="primary" />
            </div>
            <span className="font-mono text-[9px] text-text-muted">REAL-TIME SECTOR FLOW</span>
          </div>
        </Panel>
      </motion.section>

      {/* 3. Live Operations Preview Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealVariants}
      >
        <Panel className="flex flex-col gap-6 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan/15 pb-4 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={14} className="text-amber" />
                <DataLabel className="text-amber font-bold">PREVIEW MATRIX // OFFSITE LINK</DataLabel>
              </div>
              <h3 className="text-xl font-display uppercase text-text-primary tracking-wider">
                Live Operations Room Preview
              </h3>
            </div>
            <Link to="/dashboard">
              <Button variant="secondary" className="flex items-center gap-2">
                <span>VIEW LIVE DASHBOARD</span>
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

          {/* Scaled-down dashboard-like mock interface widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Widget 1: Mock Channel Feed */}
            <div className="bg-base/40 border border-cyan/10 p-3 rounded-[2px] flex flex-col gap-3 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-cyan/5 pb-2">
                <DataLabel className="text-[10px]">PITCH CHANNEL 01</DataLabel>
                <StatusPill variant="live" />
              </div>
              <div className="flex items-center justify-between py-1">
                <span>RMAD</span>
                <span className="font-display text-cyan text-lg">2</span>
                <span className="text-text-muted">VS</span>
                <span className="font-display text-cyan text-lg">1</span>
                <span>MCIT</span>
              </div>
              <div className="text-[9px] text-text-muted text-center bg-surface/50 py-1 border border-cyan/5">
                MATCH TIMELINE: 84' LAPSE
              </div>
            </div>

            {/* Widget 2: Gate Security Alerts */}
            <div className="bg-base/40 border border-cyan/10 p-3 rounded-[2px] flex flex-col gap-3 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-cyan/5 pb-2">
                <DataLabel className="text-[10px]">GATE ACCESS MONITORS</DataLabel>
                <span className="text-success font-semibold text-[9px]">ONLINE</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-text-muted">SECTOR E-01 (VIP):</span>
                <StatusPill variant="completed" />
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-text-muted">SECTOR W-04 (WEST):</span>
                <StatusPill variant="delayed" />
              </div>
            </div>

            {/* Widget 3: Live Sensor Readings */}
            <div className="bg-base/40 border border-cyan/10 p-3 rounded-[2px] flex flex-col gap-2 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-cyan/5 pb-2">
                <DataLabel className="text-[10px]">PITCH CORE TELEMETRY</DataLabel>
                <span className="text-cyan text-[9px]">STABLE</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-text-muted">PITCH TEMP:</span>
                <span className="text-text-primary">22.4 °C</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-text-muted">SPECTATOR CAP:</span>
                <span className="text-cyan">84,102 / 90,000</span>
              </div>
            </div>

          </div>
        </Panel>
      </motion.section>

    </div>
  )
}

export default Overview
