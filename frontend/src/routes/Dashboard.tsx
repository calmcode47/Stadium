import React, { useState } from 'react'
import { 
  mockMatches, 
  mockVenueZones, 
  mockAlerts, 
  mockTournament 
} from '@/mocks/operationsData'
import type { Alert } from '@/types/operations'
import LiveMatchesPanel from '@/components/dashboard/LiveMatchesPanel'
import VenueStatusPanel from '@/components/dashboard/VenueStatusPanel'
import AlertsFeedPanel from '@/components/dashboard/AlertsFeedPanel'
import TournamentProgressPanel from '@/components/dashboard/TournamentProgressPanel'

export const Dashboard: React.FC = () => {
  const [matches] = useState(mockMatches)
  const [zones] = useState(mockVenueZones)
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts)
  const [tournament] = useState(mockTournament)

  // Acknowledges an active warning or critical alert
  const acknowledgeAlert = (id: string) => {
    setAlerts(prev =>
      prev.map(alert => 
        alert.id === id ? { ...alert, isAcknowledged: true } : alert
      )
    )
  }

  // Simulates a incoming live alert to demonstrate entry flashing
  const simulateNewAlert = () => {
    const messages = [
      'Gate A automatic tourniquet reporting ticket read timeout',
      'VIP Section capacity reached 98% - Stress warning',
      'Referee requested official VAR review on Pitch Core 1',
      'Warning: Wind speeds rising to 24km/h - Monitor roof sensors',
      'Gate D secondary exit pathway opened for crowd venting'
    ]
    const levels: ('info' | 'warning' | 'critical')[] = ['info', 'warning', 'critical']
    
    const randomMsg = messages[Math.floor(Math.random() * messages.length)]
    const randomLevel = levels[Math.floor(Math.random() * levels.length)]
    
    const now = new Date()
    const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

    const newAlert: Alert = {
      id: `A-SIM-${Date.now()}`,
      timestamp,
      message: `${randomLevel.toUpperCase()}: ${randomMsg}`,
      level: randomLevel,
      isAcknowledged: false
    }

    setAlerts(prev => [newAlert, ...prev])
  }

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
