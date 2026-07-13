import React from 'react'
import { useOperations } from '@/hooks/useOperations'
import Terminal from 'lucide-react/dist/esm/icons/terminal.mjs'

export const DecisionLog: React.FC = React.memo(() => {
  const { decisionLog } = useOperations()

  return (
    <div className="flex flex-col gap-3 font-mono text-[10px] text-text-muted mt-auto pt-4 border-t border-cyan/15">
      <div className="flex items-center gap-1.5 text-cyan/70 font-semibold tracking-widest text-[9px] uppercase">
        <Terminal size={10} className="text-cyan animate-pulse" />
        <span>DECISION AUDIT TRAIL ({decisionLog.length})</span>
      </div>
      
      {decisionLog.length === 0 ? (
        <div className="text-[9px] uppercase italic text-text-muted/50 p-3 border border-dashed border-cyan/10 rounded-none text-center bg-base/20">
          No audit logs recorded for this session.
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1 flex-grow">
          {decisionLog.map((log, index) => (
            <div
              key={`${log.recId}-${index}`}
              className="flex flex-col gap-1 p-2 bg-base/35 border border-cyan/5 rounded-[2px]"
            >
              <div className="flex items-center justify-between border-b border-cyan/5 pb-1">
                <div className="flex items-center gap-1">
                  <span className={log.action === 'ACCEPTED' ? 'text-success font-bold' : 'text-danger font-bold'}>
                    [{log.action}]
                  </span>
                  <span className="text-text-muted text-[8px]">BY {log.operator}</span>
                </div>
                <span className="text-text-muted/60 text-[8px]">{log.timestamp}</span>
              </div>
              <div className="text-[9px] text-text-primary uppercase tracking-wide truncate">
                {log.title}
              </div>
              <div className="text-[8px] text-cyan/60 truncate italic">
                Action: {log.suggestedAction}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

export default DecisionLog
