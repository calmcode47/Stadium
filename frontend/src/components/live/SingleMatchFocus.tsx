import React from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { RefreshCw, Timer, Target } from 'lucide-react'
import type { Match, MatchEvent } from '@/types/operations'
import Panel from '@/components/design-system/Panel'
import DataLabel from '@/components/design-system/DataLabel'
import ScoreDigit from '@/components/design-system/ScoreDigit'

interface SingleMatchFocusProps {
  match: Match
  events: MatchEvent[]
}

export const SingleMatchFocus: React.FC<SingleMatchFocusProps> = ({ match, events }) => {
  const shouldReduceMotion = useReducedMotion()
  const isLive = match.status === 'live'

  // Map event types to visual components and icons
  const eventIcons = {
    goal: <Target size={14} className="text-success" />,
    card_yellow: <span className="w-3 h-4 bg-amber inline-block rounded-[1px] shrink-0" />,
    card_red: <span className="w-3 h-4 bg-danger inline-block rounded-[1px] shrink-0" />,
    substitution: <RefreshCw size={14} className="text-cyan animate-spin" style={{ animationDuration: '3s' }} />,
    timeout: <Timer size={14} className="text-text-muted" />
  }

  // Filter events belonging ONLY to this match
  const matchEvents = events.filter(e => e.matchId === match.id)

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. Large Broadcast Scoreboard Panel */}
      <Panel 
        live={isLive}
        className="flex flex-col items-center justify-center p-6 md:p-10 border border-cyan/20 bg-surface/50"
      >
        <div className="flex flex-col items-center gap-1 border-b border-cyan/15 w-full pb-4">
          <DataLabel className="text-cyan">LIVE BROADCAST FEED MATRIX</DataLabel>
          <span className="font-mono text-[10px] text-text-muted mt-0.5 uppercase">
            STADIUM CORE 01 // ID: {match.id}
          </span>
        </div>

        {/* Teams and Score Numbers Layout */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 md:gap-16 my-8 w-full">
          {/* Home team */}
          <div className="flex flex-col items-center sm:items-end text-center sm:text-right w-full sm:w-2/5">
            <h3 className="text-lg md:text-xl font-mono text-text-primary tracking-wider uppercase font-semibold">
              {match.teamHome}
            </h3>
            <DataLabel className="text-[10px] text-text-muted mt-1">HOME SQUAD</DataLabel>
          </div>

          {/* Scores Display */}
          <div className="flex items-center justify-center gap-6 select-none bg-base/60 border border-cyan/15 p-4 rounded-[2px] shadow-[0_0_20px_rgba(0,0,0,0.4)]">
            <div style={{ fontSize: '4.5rem' }}>
              <ScoreDigit value={match.scoreHome} colorVariant={isLive ? 'cyan' : 'primary'} />
            </div>
            <span className="font-display text-4xl text-text-muted self-center">:</span>
            <div style={{ fontSize: '4.5rem' }}>
              <ScoreDigit value={match.scoreAway} colorVariant={isLive ? 'cyan' : 'primary'} />
            </div>
          </div>

          {/* Away team */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left w-full sm:w-2/5">
            <h3 className="text-lg md:text-xl font-mono text-text-primary tracking-wider uppercase font-semibold">
              {match.teamAway}
            </h3>
            <DataLabel className="text-[10px] text-text-muted mt-1">AWAY SQUAD</DataLabel>
          </div>
        </div>

        {/* Scoreboard readouts: Clock, Status, Period */}
        <div className="flex justify-around items-center w-full max-w-md border-t border-cyan/15 pt-4 font-mono text-xs text-text-muted">
          <div className="text-center">
            <DataLabel className="block text-[9px]">TIME ELAPSED</DataLabel>
            <span className={`text-sm block mt-0.5 ${isLive ? 'text-cyan font-bold' : 'text-text-muted'}`}>
              {isLive ? `${match.timeElapsed}'` : '--'}
            </span>
          </div>
          <div className="w-px h-6 bg-cyan/15"></div>
          <div className="text-center">
            <DataLabel className="block text-[9px]">MATCH STATUS</DataLabel>
            <span className={`text-sm block mt-0.5 uppercase ${isLive ? 'text-cyan font-bold' : 'text-text-primary'}`}>
              {match.statusLabel}
            </span>
          </div>
        </div>
      </Panel>

      {/* 2. Live Incident Log */}
      <Panel className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-cyan/15 pb-2">
          <DataLabel>LIVE EVENT TELEMETRY STREAM</DataLabel>
          <span className="font-mono text-[9px] text-text-muted uppercase">
            {matchEvents.length} TOTAL REGISTERED EVENTS
          </span>
        </div>

        <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {matchEvents.length === 0 ? (
              <div className="text-center py-10 font-mono text-xs text-text-muted uppercase">
                NO REGISTERED EVENTS FOR THIS MATCH NODES
              </div>
            ) : (
              matchEvents.map((event, idx) => {
                // Determine flash color based on event type
                const flashBgColors = {
                  goal: 'rgba(46, 204, 113, 0.35)',      // Green flash
                  card_yellow: 'rgba(255, 176, 32, 0.35)', // Yellow flash
                  card_red: 'rgba(255, 71, 87, 0.35)',     // Red flash
                  substitution: 'rgba(0, 217, 255, 0.35)', // Cyan flash
                  timeout: 'rgba(139, 152, 165, 0.35)'     // Grey flash
                }
                const currentFlashColor = flashBgColors[event.type] || 'rgba(0, 217, 255, 0.2)'

                // Check if this is the newest event (first index) to trigger border flash
                const isNewestEvent = idx === 0

                return (
                  <motion.div
                    key={event.id}
                    initial={isNewestEvent ? (shouldReduceMotion ? { opacity: 0 } : { 
                      opacity: 0, 
                      y: -10, 
                      backgroundColor: currentFlashColor 
                    }) : undefined}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      backgroundColor: 'rgba(28, 36, 45, 0.3)',
                      transition: {
                        backgroundColor: shouldReduceMotion ? { duration: 0 } : { duration: 1.2, ease: 'easeOut', delay: 0.15 },
                        opacity: { duration: shouldReduceMotion ? 0 : 0.25 },
                        y: { duration: shouldReduceMotion ? 0 : 0.25 }
                      }
                    }}
                    className={`p-2.5 border rounded-[2px] flex items-center justify-between font-mono text-xs transition-all duration-300 ${
                      isNewestEvent 
                        ? 'border-cyan/70 shadow-[0_0_8px_rgba(0,217,255,0.15)]' 
                        : 'border-cyan/10'
                    }`}
                  >
                    {/* Time & Icon & Details */}
                    <div className="flex items-center gap-3">
                      <span className="text-cyan font-bold w-10 shrink-0">{event.time}</span>
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        {eventIcons[event.type]}
                      </div>
                      <span className="text-text-primary text-[11px] font-medium tracking-wide">
                        {event.detail}
                      </span>
                    </div>

                    {/* Clock Timestamp */}
                    <span className="text-text-muted text-[10px] shrink-0 ml-4">
                      {event.timestamp}
                    </span>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>
      </Panel>

    </div>
  )
}

export default SingleMatchFocus
