import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export const AppShell: React.FC = () => {
  const location = useLocation()
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="min-h-screen bg-control-room text-primary relative flex flex-col">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Panel Content Area */}
      <div className="flex-grow flex flex-col md:pl-64 pb-16 md:pb-0 min-h-screen">
        {/* Top Control Bar */}
        <TopBar />

        {/* Dynamic Route Content */}
        <main className="flex-grow p-4 md:p-8 overflow-y-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: 'easeOut' }}
              className="w-full h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

export default AppShell
