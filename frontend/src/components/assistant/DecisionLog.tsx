import React from 'react'
import { useOperations } from '@/hooks/useOperations'
import Terminal from 'lucide-react/dist/esm/icons/terminal.mjs'
import Check from 'lucide-react/dist/esm/icons/check.mjs'
import X from 'lucide-react/dist/esm/icons/x.mjs'
import WindowedList from '@/components/design-system/WindowedList'

const LIST_HEIGHT = 180
const ROW_ESTIMATE = 68

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
        <WindowedList
          items={decisionLog}
          estimateHeight={ROW_ESTIMATE}
          height={LIST_HEIGHT}
          className="pr-1 flex-grow"
          getKey={(log, index) => `${log.recId}-${log.timestamp}-${index}`}
          renderItem={log => (
            <div className="mb-2 flex flex-col gap-1 p-2 bg-base/35 border border-cyan/5 rounded-[2px]">
              <div className="flex items-center justify-between border-b border-cyan/5 pb-1">
                <div className="flex items-center gap-1 min-w-0">
                  <span
                    className={`inline-flex items-center gap-0.5 font-bold shrink-0 ${
                      log.action === 'ACCEPTED' ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {log.action === 'ACCEPTED' ? (
                      <Check size={9} aria-hidden="true" />
                    ) : (
                      <X size={9} aria-hidden="true" />
                    )}
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
          )}
        />
      )}
    </div>
  )
})

export default DecisionLog
