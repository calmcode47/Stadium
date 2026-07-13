import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { OperationsProvider } from '@/hooks/useOperations'
import AppShell from '@/components/layout/AppShell'
import Panel from '@/components/design-system/Panel'

const Overview = React.lazy(() => import('@/routes/Overview'))
const Dashboard = React.lazy(() => import('@/routes/Dashboard'))
const StadiumView = React.lazy(() => import('@/routes/StadiumView'))
const Tournaments = React.lazy(() => import('@/routes/Tournaments'))
const LiveFeed = React.lazy(() => import('@/routes/LiveFeed'))
const DesignSystemPreview = React.lazy(() => import('@/routes/DesignSystemPreview'))

const RouteLoadingFallback: React.FC = () => (
  <div className="w-full max-w-7xl mx-auto">
    <Panel className="flex flex-col gap-5 p-5 animate-pulse">
      <div className="flex items-center justify-between border-b border-cyan/15 pb-3">
        <div className="h-3 w-40 bg-cyan/20 rounded-none" />
        <div className="h-6 w-24 bg-cyan/10 border border-cyan/10 rounded-none" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-28 bg-base/50 border border-cyan/10 rounded-[2px]" />
        <div className="h-28 bg-base/50 border border-cyan/10 rounded-[2px]" />
        <div className="h-28 bg-base/50 border border-cyan/10 rounded-[2px]" />
      </div>
      <div className="h-48 bg-base/40 border border-cyan/10 rounded-[2px]" />
    </Panel>
  </div>
)

const withRouteSuspense = (node: React.ReactNode) => (
  <Suspense fallback={<RouteLoadingFallback />}>{node}</Suspense>
)

/** Defines app-wide providers, shell routing, and route-level lazy loading. */
function App() {
  return (
    <OperationsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            {/* Default overview landing page */}
            <Route index element={withRouteSuspense(<Overview />)} />
            <Route path="dashboard" element={withRouteSuspense(<Dashboard />)} />
            <Route path="stadium" element={withRouteSuspense(<StadiumView />)} />
            <Route path="tournaments" element={withRouteSuspense(<Tournaments />)} />
            <Route path="live/:matchId?" element={withRouteSuspense(<LiveFeed />)} />
            <Route path="design-system" element={withRouteSuspense(<DesignSystemPreview />)} />
          </Route>
          {/* Fallback to root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </OperationsProvider>
  )
}

export default App
