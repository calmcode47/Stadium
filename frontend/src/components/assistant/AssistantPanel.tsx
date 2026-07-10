import React, { useState, useEffect, useRef } from 'react'
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
  Loader2,
  MessageSquare,
  Send,
  Bot,
  User
} from 'lucide-react'
import { useOperations } from '@/hooks/useOperations'
import { explainWithAI, chatWithAI, type Recommendation, type ChatMessage } from '@/lib/assistantEngine'
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
    clearGeminiApiKey,
    isAuthenticated,
    matches,
    zones,
    alerts,
    tournament,
    rounds,
    sections
  } = useOperations()

  const [expandedRecId, setExpandedRecId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey)
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({})
  const [loadingExplanations, setLoadingExplanations] = useState<Record<string, boolean>>({})

  // Chat and Tab states
  const [activeTab, setActiveTab] = useState<'dispatches' | 'chat'>('dispatches')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, activeTab])

  // Update local input if context api key changes
  useEffect(() => {
    setApiKeyInput(geminiApiKey)
  }, [geminiApiKey])

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isSending) return
    if (!geminiApiKey) {
      setChatError('Please configure a Gemini API key in Settings (⚙️) to start the chat.')
      return
    }

    setChatError(null)
    const newMsg: ChatMessage = { role: 'user', text: text.trim() }
    const updatedMessages = [...messages, newMsg]
    setMessages(updatedMessages)
    setInputValue('')
    setIsSending(true)

    try {
      const operationsState = { matches, zones, alerts, tournament, rounds, sections }
      const aiResponse = await chatWithAI(
        newMsg.text,
        messages,
        operationsState,
        geminiApiKey
      )
      setMessages(prev => [...prev, { role: 'model', text: aiResponse }])
    } catch (err) {
      console.error(err)
      setChatError(err instanceof Error ? err.message : 'Failed to communicate with AI engine.')
    } finally {
      setIsSending(false)
    }
  }

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault()
    setGeminiApiKey(apiKeyInput.trim())
    setShowSettings(false)
    setChatError(null)
  }

  const handleClearApiKey = () => {
    clearGeminiApiKey()
    setChatError(null)
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
            className="fixed right-0 top-14 md:top-16 bottom-16 md:bottom-0 w-12 bg-surface/95 border-l border-cyan/20 backdrop-blur-md hidden md:flex flex-col items-center py-6 cursor-pointer hover:bg-elevated/40 transition-colors duration-150 select-none group"
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
                        Configure a Gemini API key from Google AI Studio. Keys saved here override <code className="text-cyan/80">VITE_GEMINI_API_KEY</code> in your <code className="text-cyan/80">.env</code> file.
                      </p>
                      <div className="flex gap-2 mt-1">
                        <input
                          type="password"
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          placeholder="AIzaSy... or AQ...."
                          className="flex-grow bg-elevated border border-cyan/30 text-text-primary px-2.5 py-1.5 rounded-[2px] outline-none hover:border-cyan focus:border-cyan transition-colors"
                        />
                        <Button type="submit" variant="primary" className="py-1 px-3 text-[9px] h-auto">
                          SAVE
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="py-1 px-3 text-[9px] h-auto"
                          onClick={handleClearApiKey}
                        >
                          RESET
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tabs Navigation */}
              <div className="flex border-b border-cyan/15 bg-base/10 mt-2 select-none">
                <button
                  onClick={() => setActiveTab('dispatches')}
                  className={`flex-1 py-2 font-mono text-[9px] tracking-wider uppercase font-semibold text-center border-b-2 transition-all ${
                    activeTab === 'dispatches'
                      ? 'border-cyan text-cyan bg-cyan/5'
                      : 'border-transparent text-text-muted hover:text-text-primary'
                  }`}
                >
                  Dispatches ({recommendations.length})
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-2 font-mono text-[9px] tracking-wider uppercase font-semibold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'chat'
                      ? 'border-cyan text-cyan bg-cyan/5'
                      : 'border-transparent text-text-muted hover:text-text-primary'
                  }`}
                >
                  <MessageSquare size={11} />
                  AI Chat
                </button>
              </div>

              {/* Active Tab Panel */}
              {activeTab === 'dispatches' ? (
                <>
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
                </>
              ) : (
                <div className="flex-1 flex flex-col min-h-0 pt-3 relative">
                  {/* Chat Messages */}
                  <div className="flex-grow min-h-0 overflow-y-auto pr-1 flex flex-col gap-3 custom-scrollbar">
                    {messages.length === 0 ? (
                      <div className="flex flex-col gap-4 py-4 px-1">
                        {/* Greeting card */}
                        <div className="p-4 border border-cyan/15 bg-base/20 rounded-none flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-cyan font-mono text-[10px] font-bold uppercase tracking-wider">
                            <Bot size={14} className="animate-pulse" />
                            <span>Stadium Assistant Initialized</span>
                          </div>
                          <p className="font-mono text-[9px] text-text-muted leading-relaxed uppercase">
                            Active monitoring is running. You can query current match telemetry, stadium zone capacity, safety alerts, and receive operational mitigation plans.
                          </p>
                        </div>

                        {/* Quick suggestions */}
                        <div className="flex flex-col gap-2 mt-2">
                          <span className="font-mono text-[8px] text-cyan/70 font-semibold tracking-wider uppercase">
                            SUGGESTED DISPATCH QUERIES:
                          </span>
                          <div className="flex flex-col gap-1.5">
                            {[
                              "Are there any gate congestion issues right now?",
                              "What matches are currently live?",
                              "Summarize active alerts and incidents.",
                              "Which zones have high occupancy?"
                            ].map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSendMessage(suggestion)}
                                className="text-left font-mono text-[9px] px-2.5 py-1.5 border border-cyan/15 hover:border-cyan/50 text-text-muted hover:text-cyan bg-elevated/45 hover:bg-cyan/5 transition-all select-none uppercase"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {messages.map((msg, idx) => {
                          const isUser = msg.role === 'user'
                          return (
                            <div
                              key={idx}
                              className={`flex gap-2.5 items-start ${isUser ? 'flex-row-reverse' : ''}`}
                            >
                              {/* Avatar */}
                              <div className={`p-1 flex-shrink-0 border rounded-none ${
                                isUser 
                                  ? 'bg-cyan/10 border-cyan/35 text-cyan' 
                                  : 'bg-indigo-500/10 border-indigo-500/35 text-indigo-400'
                              }`}>
                                {isUser ? <User size={12} /> : <Bot size={12} />}
                              </div>

                              {/* Text message bubble */}
                              <div className={`flex flex-col max-w-[80%] font-mono text-[9px] p-2.5 border rounded-[2px] leading-relaxed select-text ${
                                isUser
                                  ? 'bg-cyan/5 border-cyan/20 text-text-primary'
                                  : 'bg-base/40 border-cyan/10 text-text-muted'
                              }`}>
                                <div className="text-[7px] text-text-muted/60 mb-1 tracking-wider uppercase font-semibold">
                                  {isUser ? 'OPERATOR' : 'ASSISTANT'}
                                </div>
                                <div className="whitespace-pre-wrap leading-normal font-sans text-[11px] text-text-primary md:text-[10px]">
                                  {msg.text}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                        
                        {isSending && (
                          <div className="flex gap-2.5 items-start">
                            <div className="p-1 flex-shrink-0 border bg-indigo-500/10 border-indigo-500/35 text-indigo-400">
                              <Bot size={12} />
                            </div>
                            <div className="flex flex-col max-w-[80%] font-mono text-[9px] p-2.5 bg-base/40 border border-cyan/10 rounded-[2px] leading-relaxed text-text-muted italic">
                              <div className="flex items-center gap-1.5">
                                <Loader2 size={10} className="animate-spin text-cyan" />
                                <span>Analyzing stadium telemetry...</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {chatError && (
                          <div className="p-2 border border-danger/25 bg-danger/5 text-danger font-mono text-[8px] uppercase tracking-wider rounded-[2px]">
                            {chatError}
                          </div>
                        )}

                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Chat Input Area */}
                  <div className="border-t border-cyan/15 pt-3 mt-3 flex flex-col gap-2">
                    {!geminiApiKey && (
                      <div className="px-2 py-1.5 bg-amber/5 border border-amber/25 text-amber font-mono text-[8px] uppercase tracking-wider rounded-[2px] text-center">
                        Please configure a Gemini API key in Settings (⚙️) to start the chat.
                      </div>
                    )}
                    
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleSendMessage(inputValue)
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={geminiApiKey ? "Ask the assistant..." : "Configure API key to chat"}
                        disabled={!geminiApiKey || isSending}
                        className="flex-grow bg-elevated border border-cyan/20 text-text-primary font-mono text-[10px] px-2.5 py-1.5 rounded-[2px] outline-none hover:border-cyan/50 focus:border-cyan disabled:opacity-50 transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={!geminiApiKey || isSending || !inputValue.trim()}
                        className="p-1.5 bg-cyan/15 hover:bg-cyan/25 border border-cyan/35 hover:border-cyan text-cyan disabled:opacity-40 disabled:hover:bg-cyan/15 disabled:hover:border-cyan/35 disabled:hover:text-cyan transition-all rounded-none flex items-center justify-center"
                      >
                        <Send size={12} />
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AssistantPanel
