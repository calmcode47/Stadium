import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import AssistantPanel from '../assistant/AssistantPanel'

export const AppShell: React.FC = () => {
  const location = useLocation()
  const shouldReduceMotion = useReducedMotion()
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)

  return (
    <div className="min-h-screen bg-control-room text-primary relative flex flex-col overflow-x-hidden">
      {/* Skip Link for Keyboard Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-cyan text-base font-mono text-xs font-semibold tracking-wider px-4 py-2 border border-cyan uppercase select-none rounded-[2px]"
      >
        Skip to main content
      </a>

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Panel Content Area */}
      <div 
        className={`flex-grow flex flex-col md:pl-64 pb-16 md:pb-0 min-h-screen transition-all duration-200 ${
          isAssistantOpen ? 'md:pr-[380px]' : 'md:pr-12'
        }`}
      >
        {/* Top Control Bar */}
        <TopBar />

        {/* Dynamic Route Content */}
        <main id="main-content" className="flex-grow p-4 md:p-8 overflow-y-auto">
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

      {/* Persistent Collapsible rail & panel */}
      <AssistantPanel 
        isOpen={isAssistantOpen} 
        onToggle={() => setIsAssistantOpen(!isAssistantOpen)} 
      />
    </div>
  )
}

export default AppShell
