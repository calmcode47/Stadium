import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Settings,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Brain,
  Key,
  Cpu,
  ShieldAlert,
  Loader2
} from 'lucide-react'
import { useOperations } from '@/hooks/useOperations'
import { explainWithAI, type Recommendation } from '@/lib/assistantEngine'
import Panel from '../design-system/Panel'
import Button from '../design-system/Button'
import DecisionLog from './DecisionLog'

interface AssistantPanelProps {
  isOpen: boolean
  onToggle: () => void
}

export const AssistantPanel: React.FC<AssistantPanelProps> = ({ isOpen, onToggle }) => {
  const {
    recommendations,
    acceptRecommendation,
    dismissRecommendation,
    geminiApiKey,
    setGeminiApiKey,
    isAuthenticated
  } = useOperations()

  const [expandedRecId, setExpandedRecId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey)
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({})
  const [loadingExplanations, setLoadingExplanations] = useState<Record<string, boolean>>({})

  // Update local input if context api key changes
  useEffect(() => {
    setApiKeyInput(geminiApiKey)
  }, [geminiApiKey])

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault()
    setGeminiApiKey(apiKeyInput.trim())
    setShowSettings(false)
  }

  const handleToggleExpand = async (rec: Recommendation) => {
    if (expandedRecId === rec.id) {
      setExpandedRecId(null)
    } else {
      setExpandedRecId(rec.id)
      // Automatically fetch or synthesize explanation when expanded
      if (!aiExplanations[rec.id]) {
        setLoadingExplanations(prev => ({ ...prev, [rec.id]: true }))
        try {
          const explanation = rec.aiExplanation || await explainWithAI(rec.reasoning, geminiApiKey)
          setAiExplanations(prev => ({ ...prev, [rec.id]: explanation }))
        } catch (err) {
          console.error('Failed to get explanation:', err)
        } finally {
          setLoadingExplanations(prev => ({ ...prev, [rec.id]: false }))
        }
      }
    }
  }

  // Priority Pill Helper (replicates StatusPill styles but for priorities)
  const renderPriorityPill = (priority: Recommendation['priority']) => {
    const styles = {
      critical: 'border-danger text-danger bg-danger/10 dot-danger',
      high: 'border-amber text-amber bg-amber/10 dot-amber',
      medium: 'border-cyan text-cyan bg-cyan/10 dot-cyan',
      low: 'border-text-muted/40 text-text-muted bg-text-muted/5 dot-muted'
    }

    const dotColors = {
      critical: 'bg-danger',
      high: 'bg-amber',
      medium: 'bg-cyan',
      low: 'bg-text-muted/60'
    }

    return (
      <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 border font-mono text-[9px] tracking-wider uppercase font-semibold select-none rounded-none ${styles[priority]}`}>
        <span className={`w-1 h-1 inline-block ${dotColors[priority]}`} />
        <span>{priority}</span>
      </div>
    )
  }

  return (
    <div className="relative z-40 flex">
      {/* 1. COLLAPSED VERTICAL RAIL (always visible on screen right when panel is closed) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            onClick={onToggle}
            className="fixed right-0 top-16 bottom-0 w-12 bg-surface/95 border-l border-cyan/20 backdrop-blur-md flex flex-col items-center py-6 cursor-pointer hover:bg-elevated/40 transition-colors duration-150 select-none group"
          >
            {/* Brain pulsing indicator */}
            <div className="relative flex items-center justify-center w-8 h-8 rounded-none border border-cyan/35 mb-6 group-hover:border-cyan transition-colors">
              <Brain size={14} className="text-cyan animate-pulse" />
              {recommendations.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-danger text-white font-mono text-[8px] font-bold px-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full border border-base">
                  {recommendations.length}
                </span>
              )}
            </div>

            {/* Rotated Vertical Title */}
            <div className="flex-grow flex items-center justify-center w-full">
              <span className="vertical-text uppercase font-mono text-[10px] tracking-[0.25em] text-text-muted group-hover:text-cyan transition-colors duration-150">
                Operations Assistant
              </span>
            </div>

            <Cpu size={12} className="text-text-muted/40 mt-auto" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. EXPANDED SIDE PANEL */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop overlay for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
              className="fixed inset-0 bg-black z-30 md:hidden"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[380px] bg-surface/98 border-l border-cyan/25 backdrop-blur-lg z-40 shadow-2xl flex flex-col p-4 md:p-5 select-none"
            >
              {/* Header Panel */}
              <div className="flex items-center justify-between border-b border-cyan/15 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-cyan/10 border border-cyan/35 rounded-none">
                    <Brain size={16} className="text-cyan animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm tracking-wider uppercase text-text-primary">
                      Operations Assistant
                    </h3>
                    <span className="font-mono text-[8px] text-text-muted tracking-widest uppercase">
                      Core Decision Engine v1.0
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-1.5 border border-cyan/15 hover:border-cyan text-text-muted hover:text-cyan transition-colors rounded-none ${
                      showSettings ? 'bg-cyan/15 border-cyan text-cyan' : ''
                    }`}
                    title="Gemini API Key Settings"
                  >
                    <Settings size={13} />
                  </button>
                  <button
                    onClick={onToggle}
                    className="p-1.5 border border-cyan/15 hover:border-cyan text-text-muted hover:text-cyan transition-colors rounded-none"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Collapsible API Settings Form */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex-shrink-0 overflow-hidden border-b border-cyan/15 bg-base/30"
                  >
                    <form onSubmit={handleSaveApiKey} className="p-3 flex flex-col gap-2 font-mono text-[9px]">
                      <div className="flex items-center gap-1.5 text-cyan">
                        <Key size={10} />
                        <span className="font-semibold uppercase tracking-wider">Gemini API Configuration</span>
                      </div>
                      <p className="text-text-muted leading-relaxed">
                        Configure a Gemini API Key to enable plain-language natural intelligence summaries. Keys are cached locally in your browser sandbox.
                      </p>
                      <div className="flex gap-2 mt-1">
                        <input
                          type="password"
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          placeholder="AIzaSy..."
                          className="flex-grow bg-elevated border border-cyan/30 text-text-primary px-2.5 py-1.5 rounded-[2px] outline-none hover:border-cyan focus:border-cyan transition-colors"
                        />
                        <Button type="submit" variant="primary" className="py-1 px-3 text-[9px] h-auto">
                          SAVE
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Recommendations Content Area */}
              <div className="flex-1 min-h-0 overflow-y-auto py-4 flex flex-col gap-3 custom-scrollbar">
                <div className="flex items-center justify-between font-mono text-[9px] text-text-muted px-1">
                  <span>ACTIVE ISSUES: {recommendations.length}</span>
                  {recommendations.length > 0 && (
                    <span className="text-danger flex items-center gap-1 animate-pulse">
                      <ShieldAlert size={10} />
                      CRITICAL DISPATCHES REQUIRE ACTION
                    </span>
                  )}
                </div>

                {recommendations.length === 0 ? (
                  <div className="flex-grow flex flex-col items-center justify-center p-8 border border-dashed border-cyan/15 rounded-none text-center bg-base/20 my-4 opacity-75">
                    <Cpu size={24} className="text-cyan/60 mb-2 animate-pulse" />
                    <span className="font-mono text-[10px] text-cyan font-bold tracking-widest block uppercase">
                      SYSTEM NOMINAL
                    </span>
                    <p className="font-mono text-[8px] text-text-muted mt-1 uppercase max-w-[200px] leading-normal">
                      No anomalies detected. Live telemetry is nominal across all sectors.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {recommendations.map(rec => {
                      const isExpanded = expandedRecId === rec.id
                      const explanation = aiExplanations[rec.id]
                      const isLoadingExp = loadingExplanations[rec.id]

                      return (
                        <Panel
                          key={rec.id}
                          aria-live={rec.priority === 'critical' ? 'assertive' : 'polite'}
                          className={`p-3 bg-elevated/45 hover:bg-elevated/65 border transition-all duration-200 ${
                            rec.priority === 'critical'
                              ? 'border-danger/30 hover:border-danger/60'
                              : rec.priority === 'high'
                                ? 'border-amber/30 hover:border-amber/60'
                                : 'border-cyan/20 hover:border-cyan/40'
                          }`}
                        >
                          <div className="flex flex-col gap-2">
                            {/* Title & Priority Row */}
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-mono text-[10px] font-bold text-text-primary uppercase tracking-wide leading-tight">
                                {rec.title}
                              </h4>
                              {renderPriorityPill(rec.priority)}
                            </div>

                            {/* Brief summary fallback description */}
                            <p className="font-mono text-[9px] text-text-muted leading-relaxed">
                              {rec.suggestedAction}
                            </p>

                            {/* Dropdown triggers */}
                            <div className="flex items-center justify-between border-t border-cyan/5 pt-1.5 mt-1">
                              <button
                                onClick={() => handleToggleExpand(rec)}
                                aria-label={`${isExpanded ? 'Hide' : 'Expand'} reasoning for ${rec.title}`}
                                className="flex items-center gap-1 font-mono text-[8px] text-cyan hover:text-text-primary transition-colors uppercase tracking-wider"
                              >
                                {isExpanded ? (
                                  <>
                                    <span>Hide Reasoning</span>
                                    <ChevronUp size={10} />
                                  </>
                                ) : (
                                  <>
                                    <span>Expand Reasoning</span>
                                    <ChevronDown size={10} />
                                  </>
                                )}
                              </button>

                              {/* Action buttons */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => acceptRecommendation(rec)}
                                  aria-label={`Accept recommendation: ${rec.title}`}
                                  disabled={!isAuthenticated}
                                  className="flex items-center gap-1 px-2 py-0.5 bg-success/15 hover:bg-success/25 border border-success/45 hover:border-success text-success font-mono text-[8px] font-bold transition-all uppercase tracking-wider"
                                >
                                  <Check size={8} />
                                  <span>Accept</span>
                                </button>
                                <button
                                  onClick={() => dismissRecommendation(rec)}
                                  aria-label={`Dismiss recommendation: ${rec.title}`}
                                  disabled={!isAuthenticated}
                                  className="flex items-center gap-1 px-2 py-0.5 bg-base hover:bg-danger/10 border border-cyan/15 hover:border-danger/40 text-text-muted hover:text-danger font-mono text-[8px] transition-all uppercase tracking-wider"
                                >
                                  <X size={8} />
                                  <span>Dismiss</span>
                                </button>
                              </div>
                            </div>

                            {/* Expandable Reasoning Details Container */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden bg-base/40 border border-cyan/5 p-2 flex flex-col gap-2 font-mono text-[8px] leading-normal"
                                >
                                  <div className="text-[7px] text-cyan/70 font-semibold uppercase tracking-widest border-b border-cyan/5 pb-1">
                                    DETERMINISTIC ANALYSIS TRAIL
                                  </div>
                                  <ul className="list-disc pl-3 text-text-muted flex flex-col gap-1">
                                    {rec.reasoning.map((reason, rIdx) => (
                                      <li key={rIdx}>{reason}</li>
                                    ))}
                                  </ul>

                                  {/* AI Layer readout */}
                                  <div className="mt-1.5 border-t border-cyan/5 pt-1.5 flex flex-col gap-1 bg-cyan/5 p-1">
                                    <div className="flex items-center gap-1 text-cyan text-[7px] font-bold uppercase tracking-wider">
                                      <Sparkles size={8} className="animate-pulse" />
                                      <span>OPERATIONAL EXPLANATION</span>
                                    </div>
                                    {isLoadingExp ? (
                                      <div className="flex items-center gap-1 text-text-muted italic py-0.5">
                                        <Loader2 size={8} className="animate-spin text-cyan" />
                                        <span>Running explain engine...</span>
                                      </div>
                                    ) : (
                                      <div className="text-text-primary leading-normal italic">
                                        "{explanation}"
                                      </div>
                                    )}
                                    {!geminiApiKey && !isLoadingExp && (
                                      <span className="text-text-muted/40 text-[6px] tracking-widest block uppercase">
                                        * Using local synthesis template. Configure Gemini key for AI insights.
                                      </span>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </Panel>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Audit Log Component */}
              <DecisionLog />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AssistantPanel
