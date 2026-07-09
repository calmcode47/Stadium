import React from 'react'
import { useOperations } from '@/hooks/useOperations'
import LiveMatchesPanel from '@/components/dashboard/LiveMatchesPanel'
import VenueStatusPanel from '@/components/dashboard/VenueStatusPanel'
import AlertsFeedPanel from '@/components/dashboard/AlertsFeedPanel'
import TournamentProgressPanel from '@/components/dashboard/TournamentProgressPanel'

export const Dashboard: React.FC = () => {
  const {
    matches,
    zones,
    alerts,
    tournament,
    acknowledgeAlert,
    simulateNewAlert
  } = useOperations()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto pb-12">
      
      {/* 1. Live Matches Panel - Span 2 cols on desktop, 2nd priority on mobile */}
      <div className="lg:col-span-2 order-2 md:order-2 lg:order-1">
        <LiveMatchesPanel matches={matches} />
      </div>

      {/* 2. Live Alerts Feed Panel - 1 col, 1st priority (Top) on mobile */}
      <div className="lg:col-span-1 order-1 md:order-1 lg:order-2">
        <AlertsFeedPanel 
          alerts={alerts}
          onAddAlert={simulateNewAlert}
          onAcknowledgeAlert={acknowledgeAlert}
        />
      </div>

      {/* 3. Tournament Progress Panel - Span 2 cols on desktop, 4th priority on mobile */}
      <div className="lg:col-span-2 order-4 md:order-4 lg:order-3">
        <TournamentProgressPanel tournament={tournament} />
      </div>

      {/* 4. Venue Capacity/Gate Panel - 1 col, 3rd priority on mobile */}
      <div className="lg:col-span-1 order-3 md:order-3 lg:order-4">
        <VenueStatusPanel zones={zones} />
      </div>

    </div>
  )
}

export default Dashboard
