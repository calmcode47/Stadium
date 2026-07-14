import React from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import AlertTriangle from 'lucide-react/dist/esm/icons/triangle-alert.mjs'
import Info from 'lucide-react/dist/esm/icons/info.mjs'
import Skull from 'lucide-react/dist/esm/icons/skull.mjs'
import type { Alert } from '@/types/operations'
import Panel from '@/components/design-system/Panel'
import DataLabel from '@/components/design-system/DataLabel'
import Button from '@/components/design-system/Button'

interface AlertsFeedPanelProps {
  alerts: Alert[]
  onAddAlert?: () => void
  onAcknowledgeAlert?: (id: string) => void
}

export const AlertsFeedPanel: React.FC<AlertsFeedPanelProps> = React.memo(({
  alerts,
  onAddAlert,
  onAcknowledgeAlert
}) => {
  const shouldReduceMotion = useReducedMotion()

  // Map levels to color variables
  const levelStyles = {
    info: {
      border: 'border-cyan/30',
      text: 'text-cyan',
      icon: Info,
      flashBg: 'rgba(0, 217, 255, 0.35)'
    },
    warning: {
      border: 'border-amber/30',
      text: 'text-amber',
      icon: AlertTriangle,
      flashBg: 'rgba(255, 176, 32, 0.35)'
    },
    critical: {
      border: 'border-danger/30',
      text: 'text-danger',
      icon: Skull,
      flashBg: 'rgba(255, 71, 87, 0.35)'
    }
  }

  return (
    <Panel className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-cyan/15 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-danger animate-ping inline-block rounded-full" />
          <DataLabel>LIVE LOGICAL ALERTS TELEMETRY</DataLabel>
        </div>
        {onAddAlert && (
          <Button 
            variant="secondary" 
            onClick={onAddAlert}
            className="text-[9px] py-1 px-2 font-mono h-6 shrink-0"
          >
            SIMULATE ALERT
          </Button>
        )}
      </div>

      {/* Alerts Scrollable Box */}
      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {alerts.length === 0 ? (
            <div className="text-center py-6 text-xs font-mono text-text-muted select-none">
              ALERT QUEUE EMPTY
            </div>
          ) : (
            alerts.map((alert) => {
              const style = levelStyles[alert.level] || levelStyles.info
              const Icon = style.icon

              return (
                <motion.div
                  key={alert.id}
                  initial={shouldReduceMotion ? { opacity: 0 } : { 
                    opacity: 0, 
                    y: -10, 
                    backgroundColor: style.flashBg 
                  }}
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
                  exit={shouldReduceMotion ? { opacity: 0 } : { 
                    opacity: 0, 
                    x: 20, 
                    transition: { duration: 0.2 } 
                  }}
                  className={`p-2.5 border rounded-[2px] flex items-start gap-2.5 font-mono text-xs ${style.border} ${
                    alert.isAcknowledged ? 'opacity-50' : 'opacity-100'
                  }`}
                >
                  <Icon size={14} className={`${style.text} mt-0.5 shrink-0`} />
                  
                  <div className="flex-1 flex flex-col gap-0.5">
                    {/* Timestamp & Alert Source */}
                    <div className="flex justify-between items-center text-[9px]">
                      <span
                        className={`${style.text} font-bold tracking-wider uppercase`}
                        aria-live={alert.level === 'critical' ? 'assertive' : 'polite'}
                      >
                        {alert.level}
                      </span>
                      <span className="text-text-primary">{alert.timestamp}</span>
                    </div>
                    {/* Message Body */}
                    <p className="text-text-primary text-[11px] leading-relaxed break-words pr-2">
                      {alert.message}
                    </p>
                  </div>

                  {/* Acknowledge Button */}
                  {!alert.isAcknowledged && onAcknowledgeAlert && (
                    <button
                      onClick={() => onAcknowledgeAlert(alert.id)}
                      className="text-[9px] font-mono text-cyan hover:text-base border border-cyan/35 hover:border-cyan hover:bg-cyan px-1 py-0.5 select-none shrink-0"
                    >
                      ACK
                    </button>
                  )}
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>
    </Panel>
  )
})

export default AlertsFeedPanel
