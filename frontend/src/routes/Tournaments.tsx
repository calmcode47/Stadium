import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Trophy from 'lucide-react/dist/esm/icons/trophy.mjs'
import CalendarRange from 'lucide-react/dist/esm/icons/calendar-range.mjs'
import FilterX from 'lucide-react/dist/esm/icons/filter-x.mjs'
import { useOperations } from '@/hooks/useOperations'
import type { Round } from '@/types/operations'
import Panel from '@/components/design-system/Panel'
import DataLabel from '@/components/design-system/DataLabel'
import Button from '@/components/design-system/Button'
import BracketView from '@/components/tournaments/BracketView'
import ScheduleView from '@/components/tournaments/ScheduleView'

export const Tournaments: React.FC = () => {
  const { rounds } = useOperations()
  const [activeTab, setActiveTab] = useState<'bracket' | 'schedule'>('bracket')
  const [selectedRound, setSelectedRound] = useState<'all' | '1' | '2' | '3'>('all')
  type VenueFilter = 'all' | 'main' | 'east' | 'west'
  const [selectedVenue, setSelectedVenue] = useState<VenueFilter>('all')

  const resetFilters = () => {
    setSelectedRound('all')
    setSelectedVenue('all')
  }

  // Helper to map venue filter values to match names
  const venueMap: Record<string, string> = {
    main: 'MAIN VENUE Arena',
    east: 'EAST PRACTICE DOME',
    west: 'WEST CUP Arena'
  }

  const handleVenueChange = (value: string) => {
    if (value === 'all' || value === 'main' || value === 'east' || value === 'west') {
      setSelectedVenue(value)
    }
  }

  // Apply filtering logic to rounds and matches
  const getFilteredRounds = (): Round[] => {
    return rounds
      .map(round => {
        // 1. Filter by Round ID
        if (selectedRound !== 'all' && round.id !== parseInt(selectedRound)) {
          return null
        }

        // 2. Filter by Venue
        let filteredMatches = round.matches
        if (selectedVenue !== 'all') {
          const targetVenue = venueMap[selectedVenue]
          filteredMatches = round.matches.filter(m => m.venue === targetVenue)
        }

        return {
          ...round,
          matches: filteredMatches
        }
      })
      .filter((round): round is Round => round !== null)
  }

  const filteredRounds = getFilteredRounds()
  
  // Total matches count across all filtered rounds
  const totalFilteredMatches = filteredRounds.reduce((acc, curr) => acc + curr.matches.length, 0)
  
  // Flattened matches for Schedule run-sheet view
  const flattenedFilteredMatches = filteredRounds.flatMap(r => r.matches)

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12 select-none">
      
      {/* 1. Header Navigation Tabs Panel */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-cyan/20 pb-4 gap-4">
        {/* Tabs switcher */}
        <div className="flex items-center gap-1 sm:gap-2 bg-surface/50 border border-cyan/15 p-1 rounded-[2px] self-start flex-wrap">
          <button
            onClick={() => setActiveTab('bracket')}
            className={`flex items-center gap-2 px-3 py-1.5 font-mono text-xs tracking-wider uppercase transition-colors duration-100 rounded-[2px] ${
              activeTab === 'bracket'
                ? 'bg-cyan text-base font-semibold'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Trophy size={13} />
            <span className="hidden sm:inline">BRACKET MONITOR</span>
            <span className="sm:hidden">BRACKET</span>
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-3 py-1.5 font-mono text-xs tracking-wider uppercase transition-colors duration-100 rounded-[2px] ${
              activeTab === 'schedule'
                ? 'bg-cyan text-base font-semibold'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <CalendarRange size={13} />
            <span className="hidden sm:inline">CHRONOLOGICAL RUN-SHEET</span>
            <span className="sm:hidden">SCHEDULE</span>
          </button>
        </div>

        {/* Global info readout */}
        <div className="font-mono text-[10px] text-text-muted sm:text-right uppercase">
          TOURNAMENT REGISTRY // ACTIVE BRACKET // NOMINAL
        </div>
      </div>

      {/* 2. Unified Operational Filter Bar */}
      <Panel className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 py-3 bg-surface/30">
        
        {/* Round quick-filter buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <DataLabel className="mr-1">ROUND MATRIX:</DataLabel>
          <Button
            variant={selectedRound === 'all' ? 'primary' : 'secondary'}
            onClick={() => setSelectedRound('all')}
            className="py-1 px-2.5 text-[9px] font-mono h-7"
          >
            ALL STAGES
          </Button>
          <Button
            variant={selectedRound === '1' ? 'primary' : 'secondary'}
            onClick={() => setSelectedRound('1')}
            className="py-1 px-2.5 text-[9px] font-mono h-7"
          >
            QUARTERFINALS
          </Button>
          <Button
            variant={selectedRound === '2' ? 'primary' : 'secondary'}
            onClick={() => setSelectedRound('2')}
            className="py-1 px-2.5 text-[9px] font-mono h-7"
          >
            SEMIFINALS
          </Button>
          <Button
            variant={selectedRound === '3' ? 'primary' : 'secondary'}
            onClick={() => setSelectedRound('3')}
            className="py-1 px-2.5 text-[9px] font-mono h-7"
          >
            FINALS
          </Button>
        </div>

        {/* Venue dropdown selector */}
        <div className="flex items-center gap-3">
          <DataLabel>VENUE SECTOR:</DataLabel>
          <div className="relative inline-block min-w-[160px]">
            <label htmlFor="venue-filter" className="sr-only">Venue sector filter</label>
            <select
              id="venue-filter"
              value={selectedVenue}
              onChange={(e) => handleVenueChange(e.target.value)}
              className="appearance-none w-full bg-elevated border border-cyan/30 text-text-primary hover:border-cyan hover:text-cyan font-mono text-xs px-3 pr-8 py-1.5 rounded-[2px] outline-none transition-colors duration-150 uppercase tracking-widest cursor-pointer"
            >
              <option value="all">ALL STADIUM ARENAS</option>
              <option value="main">MAIN VENUE Arena</option>
              <option value="east">EAST PRACTICE DOME</option>
              <option value="west">WEST CUP Arena</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-text-muted">
              <span className="text-[10px]">▼</span>
            </div>
          </div>
        </div>

      </Panel>

      {/* 3. Main Operational Content Outlet (Fast 100ms fade-in) */}
      <motion.div
        key={`${activeTab}-${selectedRound}-${selectedVenue}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1 }}
        className="w-full"
      >
        {totalFilteredMatches === 0 ? (
          /* Empty / Edge state message */
          <div className="flex flex-col items-center justify-center p-16 border border-dashed border-cyan/15 bg-surface/20 text-center rounded-[2px] font-mono text-xs text-text-muted">
            <FilterX size={20} className="text-cyan/50 mb-3" />
            <span className="font-semibold uppercase tracking-wider text-text-primary">
              NO MATCHES SCHEDULED FOR THIS ROUND YET
            </span>
            <span className="text-[10px] mt-1 text-text-muted uppercase">
              Configure filter parameters or reset values to display active tournament tree nodes.
            </span>
            <Button 
              variant="secondary" 
              onClick={resetFilters}
              className="mt-4 py-1.5 px-3 text-[10px] font-mono h-8"
            >
              RESET MATRIX FILTERS
            </Button>
          </div>
        ) : activeTab === 'bracket' ? (
          <BracketView rounds={filteredRounds} />
        ) : (
          <ScheduleView matches={flattenedFilteredMatches} />
        )}
      </motion.div>

    </div>
  )
}

export default Tournaments
