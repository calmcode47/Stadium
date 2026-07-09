import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { OperationsProvider } from '@/hooks/useOperations'
import AppShell from '@/components/layout/AppShell'
import Overview from '@/routes/Overview'
import Dashboard from '@/routes/Dashboard'
import StadiumView from '@/routes/StadiumView'
import Tournaments from '@/routes/Tournaments'
import LiveFeed from '@/routes/LiveFeed'
import DesignSystemPreview from '@/routes/DesignSystemPreview'

function App() {
  return (
    <OperationsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            {/* Default overview landing page */}
            <Route index element={<Overview />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="stadium" element={<StadiumView />} />
            <Route path="tournaments" element={<Tournaments />} />
            <Route path="live/:matchId?" element={<LiveFeed />} />
            <Route path="design-system" element={<DesignSystemPreview />} />
          </Route>
          {/* Fallback to root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </OperationsProvider>
  )
}

export default App
