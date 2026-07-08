import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  Home, 
  LayoutDashboard, 
  Map, 
  Trophy, 
  Radio, 
  ShieldCheck 
} from 'lucide-react'
import DataLabel from '@/components/design-system/DataLabel'

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/design-system', label: 'DESIGN SYSTEM', icon: ShieldCheck, showOnMobile: false },
    { to: '/dashboard', label: 'DASHBOARD', icon: LayoutDashboard, showOnMobile: true },
    { to: '/stadium', label: '3D STADIUM', icon: Map, showOnMobile: true },
    { to: '/', label: 'OVERVIEW', icon: Home, showOnMobile: true },
    { to: '/tournaments', label: 'TOURNAMENTS', icon: Trophy, showOnMobile: true },
    { to: '/live', label: 'LIVE FEED', icon: Radio, showOnMobile: true }
  ]

  return (
    <>
      {/* Desktop Navigation Left Sidebar - Hidden on mobile, fixed width on desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-cyan/20 h-screen fixed left-0 top-0 z-40 select-none">
        
        {/* Navigation Logo Block */}
        <div className="h-16 flex items-center px-6 border-b border-cyan/15 bg-base/40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-cyan animate-pulse inline-block rounded-[1px]" />
            <span className="font-display text-xl tracking-wider text-text-primary">VENUE_OPS v1.0</span>
          </div>
        </div>

        {/* Navigation Items Link List */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 font-mono text-xs tracking-wider border-l-2 transition-all duration-200 select-none ${
                    isActive 
                      ? 'bg-cyan/5 border-cyan text-cyan font-bold' 
                      : 'border-transparent text-text-muted hover:text-text-primary hover:bg-elevated/40'
                  }`
                }
              >
                <Icon size={16} className="shrink-0" />
                <DataLabel className="text-inherit tracking-widest">{item.label}</DataLabel>
              </NavLink>
            )
          })}
        </nav>

        {/* System Status Display - Bottom of Left Sidebar */}
        <div className="p-4 border-t border-cyan/15 bg-base/20">
          <div className="flex items-center gap-2.5 px-2 py-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            <span className="font-mono text-[9px] tracking-widest text-success font-semibold uppercase">
              ALL SYSTEMS OPERATIONAL
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation Bottom Tab Bar - Visible only on mobile (<768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-cyan/20 z-50 flex items-center justify-around px-2 select-none">
        {navItems
          .filter(item => item.showOnMobile)
          .map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                aria-label={item.label}
                className={({ isActive }) => 
                  `flex flex-col items-center justify-center w-12 h-full border-t-2 transition-all duration-200 ${
                    isActive 
                      ? 'border-cyan text-cyan' 
                      : 'border-transparent text-text-muted'
                  }`
                }
              >
                <Icon size={20} />
              </NavLink>
            )
          })}
      </nav>
    </>
  )
}

export default Sidebar
