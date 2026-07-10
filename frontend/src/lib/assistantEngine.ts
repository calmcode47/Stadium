/**
 * ============================================================================
 * SMART OPERATIONS ASSISTANT - DECISION ENGINE
 * ============================================================================
 * 
 * CRITICAL ARCHITECTURAL SEPARATION:
 * 1. This file contains the CORE, DETERMINISTIC decision engine logic.
 * 2. All recommendations are derived using pure, side-effect-free TypeScript functions.
 * 3. The engine is fully offline-testable, reproducible, and deterministic:
 *    Given the same OperationsState input, it will always output the same Recommendation[].
 * 4. The optional Natural Language (AI) layer (`explainWithAI`) is strictly downstream
 *    and decoupled. It ONLY explains decisions that the deterministic engine has already
 *    made and categorized. It NEVER influences priority, thresholds, or rule evaluation.
 * 
 * This separation ensures operational reliability and defensible decision logic.
 * ============================================================================
 */

import type { Match, VenueZone, Alert, Tournament, StandSection, Round } from '../types/operations'
import {
  formatGeminiError,
  GEMINI_GENERATE_URL,
  GEMINI_MAX_CHAT_HISTORY,
  GEMINI_MAX_RETRIES,
  GEMINI_MIN_REQUEST_INTERVAL_MS,
  parseGeminiRetryDelayMs,
  waitForGeminiRateLimit
} from './geminiConfig'

export interface Recommendation {
  id: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  reasoning: string[]
  suggestedAction: string
  relatedEntityId: string
  aiExplanation?: string
}

export interface OperationsState {
  matches: Match[]
  zones: VenueZone[]
  alerts: Alert[]
  tournament: Tournament
  rounds: Round[]
  sections: StandSection[]
}

/**
 * Rule 1: Gate Congestion
 * Checks if a venue zone occupancy exceeds 85% AND a related match is within 15 minutes of ending.
 */
export function evaluateGateCongestion(
  matches: Match[],
  zones: VenueZone[],
  sections: StandSection[]
): Recommendation[] {
  const recommendations: Recommendation[] = []

  // Find if any match is close to ending (elapsed time >= 75 mins, meaning within 15 mins of final whistle)
  const nearEndMatches = matches.filter(
    m => m.isLive && m.status === 'live' && m.timeElapsed >= 75
  )

  if (nearEndMatches.length === 0) return []

  // Check VenueZones for high occupancy congestion
  for (const zone of zones) {
    const ratio = zone.occupancy / zone.maxCapacity
    if (ratio >= 0.85) {
      for (const match of nearEndMatches) {
        const minutesLeft = Math.max(0, 90 - match.timeElapsed)
        const pct = Math.round(ratio * 100)

        recommendations.push({
          id: `REC-GATE-${zone.name.replace(/[^a-zA-Z0-9]+/g, '-').toUpperCase()}-${match.id}`,
          priority: ratio >= 0.95 ? 'critical' : 'high',
          title: `Gate Congestion Risk: ${zone.name}`,
          reasoning: [
            `Zone "${zone.name}" occupancy is at ${pct}% (${zone.occupancy.toLocaleString()}/${zone.maxCapacity.toLocaleString()})`,
            `Related live match ${match.id} (${match.teamHome} vs ${match.teamAway}) ends in ${minutesLeft} min`
          ],
          suggestedAction: `Open overflow routing or gates for ${zone.name} immediately.`,
          relatedEntityId: zone.name
        })
      }
    }
  }

  // Check StandSections for high capacity closed gates
  for (const section of sections) {
    const ratio = section.occupancy / section.maxCapacity
    if (ratio >= 0.80 && section.gateStatus === 'closed') {
      for (const match of nearEndMatches) {
        const minutesLeft = Math.max(0, 90 - match.timeElapsed)
        const pct = Math.round(ratio * 100)

        recommendations.push({
          id: `REC-SECTION-${section.id.toUpperCase()}-${match.id}`,
          priority: ratio >= 0.85 ? 'high' : 'medium',
          title: `Unlock Stand Gates: ${section.name}`,
          reasoning: [
            `Stand section "${section.name}" occupancy is at ${pct}% (${section.occupancy.toLocaleString()}/${section.maxCapacity.toLocaleString()})`,
            `Stand exit gates are currently LOCKEDDOWN`,
            `Live match ${match.id} (${match.teamHome} vs ${match.teamAway}) ends in ${minutesLeft} min`
          ],
          suggestedAction: `Unlock access gates for ${section.name} to permit early egress.`,
          relatedEntityId: section.id
        })
      }
    }
  }

  return recommendations
}

/**
 * Rule 2: Match Delay Risk
 * Checks if a venue has multiple delayed or delayed-risk matches.
 */
export function evaluateMatchDelayRisk(rounds: Round[]): Recommendation[] {
  const recommendations: Recommendation[] = []
  
  // Flatten bracket matches
  const allBracketMatches = rounds.flatMap(r => r.matches)

  // Group bracket matches by venue
  const venueMatches: Record<string, typeof allBracketMatches> = {}
  for (const bm of allBracketMatches) {
    if (!venueMatches[bm.venue]) {
      venueMatches[bm.venue] = []
    }
    venueMatches[bm.venue].push(bm)
  }

  for (const [venue, bMatches] of Object.entries(venueMatches)) {
    const delayedMatches = bMatches.filter(m => m.status === 'delayed')
    const scheduledMatches = bMatches.filter(m => m.status === 'scheduled')

    if (delayedMatches.length > 0 && scheduledMatches.length > 0) {
      for (const dm of delayedMatches) {
        for (const sm of scheduledMatches) {
          recommendations.push({
            id: `REC-DELAY-${dm.id}-${sm.id}`,
            priority: 'medium',
            title: `Schedule Delay Risk: ${venue}`,
            reasoning: [
              `Match ${dm.id} (${dm.teamHome} vs ${dm.teamAway}) is delayed at "${venue}"`,
              `Subsequent match ${sm.id} (${sm.teamHome} vs ${sm.teamAway}) is scheduled at the same venue`,
              `Compounding delay risk detected for shared venue resource`
            ],
            suggestedAction: `Adjust subsequent kickoff slot for ${sm.id} by +30 minutes.`,
            relatedEntityId: dm.id
          })
        }
      }
    }
  }

  return recommendations
}

/**
 * Rule 3: Incident Escalation
 * Checks if unresolved alerts at the same venue zone exceed a count within a time window (or active alerts).
 */
export function evaluateIncidentEscalation(alerts: Alert[]): Recommendation[] {
  const recommendations: Recommendation[] = []
  const unresolved = alerts.filter(a => !a.isAcknowledged)

  // Group unresolved alerts by zone keywords
  const zoneAlerts: Record<string, Alert[]> = {}
  for (const alert of unresolved) {
    let zone = 'GENERAL STADIUM AREA'
    const msg = alert.message.toUpperCase()
    if (msg.includes('GATE B') || msg.includes('WEST')) {
      zone = 'SECTOR GATE B (WEST)'
    } else if (msg.includes('GATE A') || msg.includes('EAST')) {
      zone = 'SECTOR GATE A (EAST)'
    } else if (msg.includes('VIP')) {
      zone = 'VIP HOSPITALITY SUITES'
    } else if (msg.includes('CONCOURSE')) {
      zone = 'MAIN CONCOURSE'
    } else if (msg.includes('CAR PARK') || msg.includes('NORTH')) {
      zone = 'NORTH CAR PARK'
    }

    if (!zoneAlerts[zone]) {
      zoneAlerts[zone] = []
    }
    zoneAlerts[zone].push(alert)
  }

  for (const [zone, alertsInZone] of Object.entries(zoneAlerts)) {
    if (alertsInZone.length >= 2) {
      const hasCritical = alertsInZone.some(a => a.level === 'critical')
      
      recommendations.push({
        id: `REC-INCIDENT-${zone.replace(/[^a-zA-Z0-9]+/g, '-').toUpperCase()}`,
        priority: hasCritical ? 'critical' : 'high',
        title: `Incident Dispatch: ${zone}`,
        reasoning: [
          `${alertsInZone.length} unacknowledged alerts detected in "${zone}"`,
          ...alertsInZone.map(a => `[${a.timestamp}] ${a.message}`)
        ],
        suggestedAction: `Dispatch a tactical operations patrol to resolve incidents in ${zone}.`,
        relatedEntityId: zone
      })
    }
  }

  return recommendations
}

/**
 * Rule 4: Tournament Bottleneck
 * Flags rounds where delayed matches prevent subsequent round progression.
 */
export function evaluateTournamentBottleneck(rounds: Round[]): Recommendation[] {
  const recommendations: Recommendation[] = []

  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i]
    const delayedMatches = round.matches.filter(m => m.status === 'delayed')

    if (delayedMatches.length > 0) {
      const completed = round.matches.filter(m => m.status === 'completed').length
      const total = round.matches.length
      const pct = Math.round((completed / total) * 100)

      // Find if later rounds have scheduled matches with TBD placeholders
      const subsequentRounds = rounds.slice(i + 1)
      const blockedMatches: string[] = []

      for (const subRound of subsequentRounds) {
        for (const subMatch of subRound.matches) {
          const isTbd = subMatch.teamHome.includes('TBD') || subMatch.teamAway.includes('TBD')
          if (isTbd) {
            blockedMatches.push(`${subMatch.id} (${subMatch.teamHome} vs ${subMatch.teamAway})`)
          }
        }
      }

      if (blockedMatches.length > 0) {
        for (const dm of delayedMatches) {
          const reasoning = [
            `Round "${round.name}" is bottlenecked at ${pct}% completion (${completed}/${total} matches)`,
            `Delayed match ${dm.id} (${dm.teamHome} vs ${dm.teamAway}) halts progression`,
            `Blocks progression of: ${blockedMatches.slice(0, 2).join(', ')}`
          ]

          recommendations.push({
            id: `REC-BOTTLENECK-${dm.id}`,
            priority: 'medium',
            title: `Bracket Bottleneck: ${round.name}`,
            reasoning,
            suggestedAction: `Fast-track pitch resolution for ${dm.id} or manually override winner to clear the bracket.`,
            relatedEntityId: dm.id
          })
        }
      }
    }
  }

  return recommendations
}

/**
 * Standardized entry point to generate and prioritize recommendations.
 * Priority hierarchy: critical > high > medium > low.
 */
export function generateRecommendations(state: OperationsState): Recommendation[] {
  const { matches, zones, alerts, rounds, sections } = state

  const congestion = evaluateGateCongestion(matches, zones, sections)
  const delay = evaluateMatchDelayRisk(rounds)
  const incident = evaluateIncidentEscalation(alerts)
  const bottleneck = evaluateTournamentBottleneck(rounds)

  const all = [...congestion, ...delay, ...incident, ...bottleneck]

  // Priority sorting helper
  const priorityWeight = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1
  }

  return all.sort((a, b) => {
    const diff = priorityWeight[b.priority] - priorityWeight[a.priority]
    if (diff !== 0) return diff
    return a.id.localeCompare(b.id) // deterministic alphabetical tie-breaker
  })
}

/**
 * Optional Natural Language Layer (Gemini-powered or template fallback)
 * Explains the structured factors in a single plain-language sentence.
 */
export async function explainWithAI(reasoning: string[], apiKey?: string): Promise<string> {
  if (!apiKey) {
    // Return template-based explanation (joining factors with " and ")
    const joined = reasoning.map(r => r.trim().replace(/\.$/, '')).join(' and ')
    return `${joined}.`
  }

  try {
    const response = await callGemini(apiKey, {
      contents: [
        {
          parts: [
            {
              text: `Synthesize the following stadium operational events into a single, cohesive, plain-language operator summary sentence.
Format: Write a single, brief sentence (max 18 words) explaining what is happening. Keep it professional.
Events to summarize:
${reasoning.map(r => `- ${r}`).join('\n')}`
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 60,
        temperature: 0.15
      }
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    return text || `Status briefing: ${reasoning.join(' and ')}.`
  } catch (e) {
    console.warn('AI explain failed, falling back to local synthesis:', e)
    const joined = reasoning.map(r => r.trim().replace(/\.$/, '')).join(' and ')
    return `Local briefing: ${joined}.`
  }
}

export interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

async function callGemini(apiKey: string, body: Record<string, unknown>): Promise<Response> {
  await waitForGeminiRateLimit()

  let attempt = 0
  while (attempt <= GEMINI_MAX_RETRIES) {
    const response = await fetch(GEMINI_GENERATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey.trim()
      },
      body: JSON.stringify(body)
    })

    if (response.status !== 429 || attempt === GEMINI_MAX_RETRIES) {
      return response
    }

    const errorText = await response.text()
    const retryDelayMs = parseGeminiRetryDelayMs(errorText) ?? GEMINI_MIN_REQUEST_INTERVAL_MS
    await new Promise(resolve => setTimeout(resolve, retryDelayMs))
    attempt += 1
  }

  throw new Error('Gemini request failed after retries')
}

export async function chatWithAI(
  message: string,
  history: ChatMessage[],
  state: OperationsState,
  apiKey: string
): Promise<string> {
  if (!apiKey) {
    throw new Error('API key is required for AI chat')
  }

  // Construct a concise summary of the current live operations state
  const liveMatches = state.matches
    .map(m => `- Match: ${m.teamHome} vs ${m.teamAway} (${m.scoreHome}-${m.scoreAway}), elapsed: ${m.timeElapsed} mins, status: ${m.statusLabel} (isLive: ${m.isLive})`)
    .join('\n')

  const zoneOccupancies = state.zones
    .map(z => `- Zone: ${z.name}, occupancy: ${z.occupancy}/${z.maxCapacity} (${Math.round((z.occupancy / z.maxCapacity) * 100)}%), status: ${z.statusLabel}`)
    .join('\n')

  const standSections = state.sections
    .map(s => `- Section: ${s.name}, gates: ${s.gateStatus.toUpperCase()}, incidents: ${s.incidents}, occupancy: ${s.occupancy}/${s.maxCapacity}`)
    .join('\n')

  const activeAlerts = state.alerts
    .filter(a => !a.isAcknowledged)
    .map(a => `- Alert [${a.level.toUpperCase()}] at ${a.timestamp}: ${a.message}`)
    .join('\n')

  const currentRecs = generateRecommendations(state)
  const recommendationsStr = currentRecs
    .map(r => `- [${r.priority.toUpperCase()}] ${r.title}: ${r.suggestedAction} (Reasoning: ${r.reasoning.join(', ')})`)
    .join('\n')

  const systemInstruction = `You are the AI Assistant for the Smart Stadium & Tournament Operations control room.
Your role is to help the operations manager/operator monitor the stadium state, coordinate actions, resolve bottlenecks, and manage events.
Answer concisely, in a professional and direct tone (avoid overly flowery language). Use bullet points and numbers where helpful.

Here is the current live telemetry operations state:

[LIVE MATCHES]
${liveMatches || 'No matches listed.'}

[STADIUM ZONE OCCUPANCY]
${zoneOccupancies || 'No zone data.'}

[STAND SECTIONS]
${standSections || 'No section data.'}

[UNACKNOWLEDGED ALERTS]
${activeAlerts || 'All alerts are acknowledged/clear.'}

[CURRENT DECISION RECOMMENDATIONS]
${recommendationsStr || 'No active recommendations/anomalies detected.'}

If asked about matches, zones, gate status, or incidents, use the real-time telemetry above to answer. Support the operator with clear decision reasoning. Keep answers under 100 words where possible.`

  // Prepare standard Gemini API chat format (trim history to conserve quota)
  const recentHistory = history.slice(-GEMINI_MAX_CHAT_HISTORY)
  const contents = [
    ...recentHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    })),
    {
      role: 'user',
      parts: [{ text: message }]
    }
  ]

  try {
    const response = await callGemini(apiKey, {
      contents,
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.25
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API Error Response:', errorText)
      let parsedError = errorText
      try {
        const parsed = JSON.parse(errorText)
        parsedError = parsed.error?.message || errorText
      } catch {}
      throw new Error(formatGeminiError(response.status, parsedError))
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    return text || "No response received from the operations engine."
  } catch (error) {
    console.error('Gemini chat request failed:', error)
    throw error
  }
}

