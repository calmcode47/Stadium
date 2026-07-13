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

import type { Alert, Match, OperationsState, Recommendation, Round, StandSection, VenueZone } from '../types/operations'
import { getGeminiGenerateUrl } from '../config/gemini.js'

// 85% occupancy is the point where egress queues become operationally sensitive before final whistle.
export const GATE_CONGESTION_RATIO = 0.85
// 95% occupancy is treated as critical because crowd movement options are nearly exhausted.
export const CRITICAL_CONGESTION_RATIO = 0.95
// 75 minutes means a football match is within the final 15 minutes of regulation.
export const NEAR_MATCH_END_MINUTE = 75
// Locked stand exits above 80% occupancy should be reviewed before a major egress wave begins.
export const LOCKED_SECTION_RATIO = 0.8
// Two unresolved alerts in the same zone are enough to indicate a pattern, not a single noisy sensor.
export const INCIDENT_CLUSTER_COUNT = 2
// A same-venue delayed match is urgent when the next scheduled slot is within one hour.
export const TIGHT_TURNAROUND_MINUTES = 60
// Recent incidents are weighted more heavily because active operators still need to respond.
export const RECENT_INCIDENT_MINUTES = 15

const priorityWeight: Record<Recommendation['priority'], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
}

const slug = (input: string): string => input.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase()

/** Evaluates crowd egress risk from live-match timing, zone occupancy, and locked stand exits. */
export const evaluateGateCongestion = (
  matches: Match[],
  zones: VenueZone[],
  sections: StandSection[]
): Recommendation[] => {
  const nearEndMatches = matches.filter(
    match => match.isLive && match.status === 'live' && match.timeElapsed >= NEAR_MATCH_END_MINUTE
  )

  if (nearEndMatches.length === 0) return []

  const zoneRecommendations = zones.flatMap(zone => {
    const ratio = zone.occupancy / zone.maxCapacity
    if (ratio < GATE_CONGESTION_RATIO) return []

    return nearEndMatches.map(match => {
      const minutesLeft = Math.max(0, 90 - match.timeElapsed)
      const pct = Math.round(ratio * 100)
      return {
        id: `REC-GATE-${slug(zone.name)}-${match.id}`,
        priority: ratio >= CRITICAL_CONGESTION_RATIO ? 'critical' : 'high',
        title: `Gate Congestion Risk: ${zone.name}`,
        reasoning: [
          `Zone "${zone.name}" occupancy is at ${pct}% (${zone.occupancy.toLocaleString()}/${zone.maxCapacity.toLocaleString()})`,
          `Related live match ${match.id} (${match.teamHome} vs ${match.teamAway}) ends in ${minutesLeft} min`
        ],
        suggestedAction: `Open overflow routing or gates for ${zone.name} immediately.`,
        relatedEntityId: zone.name
      } satisfies Recommendation
    })
  })

  const sectionRecommendations = sections.flatMap(section => {
    const ratio = section.occupancy / section.maxCapacity
    if (ratio < LOCKED_SECTION_RATIO || section.gateStatus !== 'closed') return []

    return nearEndMatches.map(match => {
      const minutesLeft = Math.max(0, 90 - match.timeElapsed)
      const pct = Math.round(ratio * 100)
      return {
        id: `REC-SECTION-${section.id.toUpperCase()}-${match.id}`,
        priority: ratio >= GATE_CONGESTION_RATIO ? 'high' : 'medium',
        title: `Unlock Stand Gates: ${section.name}`,
        reasoning: [
          `Stand section "${section.name}" occupancy is at ${pct}% (${section.occupancy.toLocaleString()}/${section.maxCapacity.toLocaleString()})`,
          'Stand exit gates are currently LOCKEDDOWN',
          `Live match ${match.id} (${match.teamHome} vs ${match.teamAway}) ends in ${minutesLeft} min`
        ],
        suggestedAction: `Unlock access gates for ${section.name} to permit early egress.`,
        relatedEntityId: section.id
      } satisfies Recommendation
    })
  })

  return [...zoneRecommendations, ...sectionRecommendations]
}

/** Evaluates same-venue schedule risk and weights priority by the gap to the next scheduled match. */
export const evaluateMatchDelayRisk = (rounds: Round[]): Recommendation[] => {
  const allMatches = rounds.flatMap(round => round.matches)
  const byVenue = new Map<string, typeof allMatches>()

  for (const match of allMatches) {
    const existing = byVenue.get(match.venue) ?? []
    existing.push(match)
    byVenue.set(match.venue, existing)
  }

  const recommendations: Recommendation[] = []
  for (const [venue, matchesAtVenue] of byVenue.entries()) {
    const delayed = matchesAtVenue.filter(match => match.status === 'delayed')
    const scheduled = matchesAtVenue.filter(match => match.status === 'scheduled')

    for (const delayedMatch of delayed) {
      for (const scheduledMatch of scheduled) {
        const gapMinutes = minutesBetween(delayedMatch.scheduledStart, scheduledMatch.scheduledStart)
        if (gapMinutes !== null && gapMinutes < 0) continue
        const priority: Recommendation['priority'] =
          gapMinutes !== null && gapMinutes <= TIGHT_TURNAROUND_MINUTES
            ? 'high'
            : gapMinutes !== null && gapMinutes > 180
              ? 'low'
              : 'medium'
        const gapReason =
          gapMinutes === null
            ? 'No reliable scheduled-start gap is available, so shared venue contention is treated as medium risk'
            : `Next same-venue kickoff is ${gapMinutes} min after the delayed match slot`

        recommendations.push({
          id: `REC-DELAY-${delayedMatch.id}-${scheduledMatch.id}`,
          priority,
          title: `Schedule Delay Risk: ${venue}`,
          reasoning: [
            `Match ${delayedMatch.id} (${delayedMatch.teamHome} vs ${delayedMatch.teamAway}) is delayed at "${venue}"`,
            `Subsequent match ${scheduledMatch.id} (${scheduledMatch.teamHome} vs ${scheduledMatch.teamAway}) is scheduled at the same venue`,
            gapReason
          ],
          suggestedAction: `Adjust subsequent kickoff slot for ${scheduledMatch.id} by +30 minutes.`,
          relatedEntityId: delayedMatch.id
        })
      }
    }
  }

  return recommendations
}

/** Evaluates unresolved alert clusters by venue keyword, severity, and incident recency. */
export const evaluateIncidentEscalation = (alerts: Alert[]): Recommendation[] => {
  const unresolved = alerts.filter(alert => !alert.isAcknowledged)
  const zoneAlerts = new Map<string, Alert[]>()

  for (const alert of unresolved) {
    const zone = inferAlertZone(alert.message)
    const existing = zoneAlerts.get(zone) ?? []
    existing.push(alert)
    zoneAlerts.set(zone, existing)
  }

  const recommendations: Recommendation[] = []
  for (const [zone, alertsInZone] of zoneAlerts.entries()) {
    if (alertsInZone.length < INCIDENT_CLUSTER_COUNT) continue

    const hasCritical = alertsInZone.some(alert => alert.level === 'critical')
    const recentCount = alertsInZone.filter(isRecentAlert).length
    const priority: Recommendation['priority'] = hasCritical ? 'critical' : 'high'
    recommendations.push({
      id: `REC-INCIDENT-${slug(zone)}`,
      priority,
      title: `Incident Dispatch: ${zone}`,
      reasoning: [
        `${alertsInZone.length} unacknowledged alerts detected in "${zone}"`,
        `${recentCount} alert${recentCount === 1 ? '' : 's'} occurred within the last ${RECENT_INCIDENT_MINUTES} minutes and highest severity is ${highestSeverity(alertsInZone).toUpperCase()}`,
        ...alertsInZone.map(alert => `[${alert.timestamp}] ${alert.message}`)
      ],
      suggestedAction: `Dispatch a tactical operations patrol to resolve incidents in ${zone}.`,
      relatedEntityId: zone
    })
  }

  return recommendations
}

/** Evaluates delayed bracket matches that block downstream TBD slots from being resolved. */
export const evaluateTournamentBottleneck = (rounds: Round[]): Recommendation[] => {
  const recommendations: Recommendation[] = []

  rounds.forEach((round, index) => {
    const delayedMatches = round.matches.filter(match => match.status === 'delayed')
    if (delayedMatches.length === 0) return

    const completed = round.matches.filter(match => match.status === 'completed').length
    const total = round.matches.length
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
    const immediateNextRound = rounds[index + 1]
    const subsequentRounds = rounds.slice(index + 1)
    const blockedMatches = subsequentRounds
      .flatMap(subRound => subRound.matches)
      .filter(match => match.teamHome.includes('TBD') || match.teamAway.includes('TBD'))
      .map(match => `${match.id} (${match.teamHome} vs ${match.teamAway})`)

    if (blockedMatches.length === 0) return

    for (const delayedMatch of delayedMatches) {
      const directlyBlocksNextRound = Boolean(
        immediateNextRound?.matches.some(match => match.teamHome.includes('TBD') || match.teamAway.includes('TBD'))
      )
      const priority: Recommendation['priority'] = directlyBlocksNextRound && pct >= 75 ? 'high' : 'medium'
      recommendations.push({
        id: `REC-BOTTLENECK-${delayedMatch.id}`,
        priority,
        title: `Bracket Bottleneck: ${round.name}`,
        reasoning: [
          `Round "${round.name}" is bottlenecked at ${pct}% completion (${completed}/${total} matches)`,
          `Delayed match ${delayedMatch.id} (${delayedMatch.teamHome} vs ${delayedMatch.teamAway}) halts progression`,
          directlyBlocksNextRound ? 'The immediate next round still has TBD slots waiting on this result' : 'Later bracket slots still depend on this result',
          `Blocks progression of: ${blockedMatches.slice(0, 2).join(', ')}`
        ],
        suggestedAction: `Fast-track pitch resolution for ${delayedMatch.id} or manually override winner to clear the bracket.`,
        relatedEntityId: delayedMatch.id
      })
    }
  })

  return recommendations
}

/** Generates deterministic recommendations from the full operations snapshot sorted by priority. */
export const generateRecommendations = (state: OperationsState): Recommendation[] => {
  const all = [
    ...evaluateGateCongestion(state.matches, state.zones, state.sections),
    ...evaluateMatchDelayRisk(state.rounds),
    ...evaluateIncidentEscalation(state.alerts),
    ...evaluateTournamentBottleneck(state.rounds)
  ]

  return all.sort((left, right) => {
    const priorityDifference = priorityWeight[right.priority] - priorityWeight[left.priority]
    return priorityDifference === 0 ? left.id.localeCompare(right.id) : priorityDifference
  })
}

/** Produces a short natural-language explanation for a deterministic recommendation. */
export const explainWithAI = async (recommendation: Recommendation, apiKey?: string): Promise<string> => {
  if (!apiKey) return templateExplanation(recommendation.reasoning)

  try {
    const response = await fetch(getGeminiGenerateUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey.trim()
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Write one professional sentence under 18 words explaining this stadium operations recommendation:\n${recommendation.reasoning.map(reason => `- ${reason}`).join('\n')}`
              }
            ]
          }
        ],
        generationConfig: { maxOutputTokens: 60, temperature: 0.15 }
      })
    })

    if (!response.ok) return templateExplanation(recommendation.reasoning)
    const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? templateExplanation(recommendation.reasoning)
  } catch {
    return templateExplanation(recommendation.reasoning)
  }
}

const templateExplanation = (reasoning: string[]): string => `${reasoning.map(reason => reason.trim().replace(/\.$/, '')).join(' and ')}.`

const minutesBetween = (from?: string, to?: string): number | null => {
  if (!from || !to) return null
  const fromMs = Date.parse(from)
  const toMs = Date.parse(to)
  if (Number.isNaN(fromMs) || Number.isNaN(toMs)) return null
  return Math.round((toMs - fromMs) / 60_000)
}

const isRecentAlert = (alert: Alert): boolean => {
  if (!alert.createdAt) return false
  const createdMs = Date.parse(alert.createdAt)
  if (Number.isNaN(createdMs)) return false
  return Date.now() - createdMs <= RECENT_INCIDENT_MINUTES * 60_000
}

const highestSeverity = (alerts: Alert[]): Alert['level'] => {
  if (alerts.some(alert => alert.level === 'critical')) return 'critical'
  if (alerts.some(alert => alert.level === 'warning')) return 'warning'
  return 'info'
}

const inferAlertZone = (message: string): string => {
  const upper = message.toUpperCase()
  if (upper.includes('GATE B') || upper.includes('WEST')) return 'SECTOR GATE B (WEST)'
  if (upper.includes('GATE A') || upper.includes('EAST')) return 'SECTOR GATE A (EAST)'
  if (upper.includes('VIP')) return 'VIP HOSPITALITY SUITES'
  if (upper.includes('CONCOURSE')) return 'MAIN CONCOURSE'
  if (upper.includes('CAR PARK') || upper.includes('NORTH')) return 'NORTH CAR PARK'
  return 'GENERAL STADIUM AREA'
}
