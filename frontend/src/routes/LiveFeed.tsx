import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import Radio from 'lucide-react/dist/esm/icons/radio.mjs'
import LayoutGrid from 'lucide-react/dist/esm/icons/layout-grid.mjs'
import AlertTriangle from 'lucide-react/dist/esm/icons/triangle-alert.mjs'
import { useOperations } from '@/hooks/useOperations'
import Panel from '@/components/design-system/Panel'
import DataLabel from '@/components/design-system/DataLabel'
import Button from '@/components/design-system/Button'
import SingleMatchFocus from '@/components/live/SingleMatchFocus'
import AllMatchesTicker from '@/components/live/AllMatchesTicker'

export const LiveFeed: React.FC = () => {
  const shouldReduceMotion = useReducedMotion()
  const { matchId } = useParams<{ matchId?: string }>()
  const navigate = useNavigate()

  // Consume simulation hook for live clocks, scores, and event updates
  const { matches, events } = useOperations()

  const [activeMode, setActiveMode] = useState<'single' | 'ticker'>('single')
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)

  // Sync state with router URL parameter
  useEffect(() => {
    if (matchId) {
      setSelectedMatchId(matchId)
      setActiveMode('single')
    } else if (!selectedMatchId) {
      // Default to first match if no id is specified
      setSelectedMatchId('M-101')
    }
  }, [matchId, selectedMatchId])

  const handleMatchSelect = (id: string) => {
    setSelectedMatchId(id)
    navigate(`/live/${id}`)
  }

  // Find currently selected match in simulated matches list
  const activeMatch = matches.find(m => m.id === selectedMatchId)

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12 select-none">
      
      {/* 1. View Toggles & Select Header Panel */}
      <Panel className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 bg-surface/30">
        
        {/* Mode Toggle Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant={activeMode === 'single' ? 'primary' : 'secondary'}
            onClick={() => setActiveMode('single')}
            className="py-1 px-2.5 text-[9px] font-mono flex items-center gap-1.5"
          >
            <Radio size={12} className={activeMode === 'single' ? 'animate-pulse' : ''} />
            <span>SINGLE FOCUS</span>
          </Button>
          <Button
            variant={activeMode === 'ticker' ? 'primary' : 'secondary'}
            onClick={() => setActiveMode('ticker')}
            className="py-1 px-2.5 text-[9px] font-mono flex items-center gap-1.5"
          >
            <LayoutGrid size={12} />
            <span>ALL TICKER WALL</span>
          </Button>
        </div>

        {/* Dynamic Selector Dropdown (visible in Single Match Focus) */}
        {activeMode === 'single' && (
          <div className="flex items-center gap-3">
            <DataLabel>FOCUS TARGET:</DataLabel>
            <div className="relative inline-block min-w-[200px]">
              <label htmlFor="live-match-select" className="sr-only">Live match focus target</label>
              <select
                id="live-match-select"
                value={selectedMatchId || ''}
                onChange={(e) => handleMatchSelect(e.target.value)}
                className="appearance-none w-full bg-elevated border border-cyan/30 text-text-primary hover:border-cyan hover:text-cyan font-mono text-xs px-3 pr-8 py-1.5 rounded-[2px] outline-none transition-colors duration-150 uppercase tracking-widest cursor-pointer"
              >
                {matches.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.id} - {m.teamHome} VS {m.teamAway}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-text-muted">
                <span className="text-[10px]">▼</span>
              </div>
            </div>
          </div>
        )}

      </Panel>

      {/* 2. Main Live Content Area (fast 100ms fade) */}
      <motion.div
        key={`${activeMode}-${selectedMatchId}`}
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.1 }}
        className="w-full"
      >
        {activeMode === 'single' ? (
          activeMatch ? (
            <SingleMatchFocus match={activeMatch} events={events} />
          ) : (
            /* Error/Empty state for mismatch ID */
            <div className="flex flex-col items-center justify-center p-16 border border-dashed border-cyan/15 bg-surface/20 text-center rounded-[2px] font-mono text-xs text-text-muted">
              <AlertTriangle size={20} className="text-cyan/50 mb-3 animate-bounce" />
              <span className="font-semibold uppercase tracking-wider text-text-primary">
                MATCH CORE NODE NOT DETECTED
              </span>
              <span className="text-[10px] mt-1 text-text-muted uppercase">
                The specified channel index does not exist in the active spectator registry.
              </span>
              <Button 
                variant="secondary" 
                onClick={() => handleMatchSelect('M-101')}
                className="mt-4 py-1.5 px-3 text-[10px] font-mono"
              >
                RESET TO CORE CHANNEL M-101
              </Button>
            </div>
          )
        ) : (
          <AllMatchesTicker 
            matches={matches} 
            selectedMatchId={selectedMatchId}
            onSelectMatch={handleMatchSelect}
          />
        )}
      </motion.div>

    </div>
  )
}

export default LiveFeed
