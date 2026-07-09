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

const priorityWeight: Record<Recommendation['priority'], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
}

const slug = (input: string): string => input.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase()

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
        recommendations.push({
          id: `REC-DELAY-${delayedMatch.id}-${scheduledMatch.id}`,
          priority: 'medium',
          title: `Schedule Delay Risk: ${venue}`,
          reasoning: [
            `Match ${delayedMatch.id} (${delayedMatch.teamHome} vs ${delayedMatch.teamAway}) is delayed at "${venue}"`,
            `Subsequent match ${scheduledMatch.id} (${scheduledMatch.teamHome} vs ${scheduledMatch.teamAway}) is scheduled at the same venue`,
            'Compounding delay risk detected for shared venue resource'
          ],
          suggestedAction: `Adjust subsequent kickoff slot for ${scheduledMatch.id} by +30 minutes.`,
          relatedEntityId: delayedMatch.id
        })
      }
    }
  }

  return recommendations
}

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
    recommendations.push({
      id: `REC-INCIDENT-${slug(zone)}`,
      priority: hasCritical ? 'critical' : 'high',
      title: `Incident Dispatch: ${zone}`,
      reasoning: [
        `${alertsInZone.length} unacknowledged alerts detected in "${zone}"`,
        ...alertsInZone.map(alert => `[${alert.timestamp}] ${alert.message}`)
      ],
      suggestedAction: `Dispatch a tactical operations patrol to resolve incidents in ${zone}.`,
      relatedEntityId: zone
    })
  }

  return recommendations
}

export const evaluateTournamentBottleneck = (rounds: Round[]): Recommendation[] => {
  const recommendations: Recommendation[] = []

  rounds.forEach((round, index) => {
    const delayedMatches = round.matches.filter(match => match.status === 'delayed')
    if (delayedMatches.length === 0) return

    const completed = round.matches.filter(match => match.status === 'completed').length
    const total = round.matches.length
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
    const subsequentRounds = rounds.slice(index + 1)
    const blockedMatches = subsequentRounds
      .flatMap(subRound => subRound.matches)
      .filter(match => match.teamHome.includes('TBD') || match.teamAway.includes('TBD'))
      .map(match => `${match.id} (${match.teamHome} vs ${match.teamAway})`)

    if (blockedMatches.length === 0) return

    for (const delayedMatch of delayedMatches) {
      recommendations.push({
        id: `REC-BOTTLENECK-${delayedMatch.id}`,
        priority: 'medium',
        title: `Bracket Bottleneck: ${round.name}`,
        reasoning: [
          `Round "${round.name}" is bottlenecked at ${pct}% completion (${completed}/${total} matches)`,
          `Delayed match ${delayedMatch.id} (${delayedMatch.teamHome} vs ${delayedMatch.teamAway}) halts progression`,
          `Blocks progression of: ${blockedMatches.slice(0, 2).join(', ')}`
        ],
        suggestedAction: `Fast-track pitch resolution for ${delayedMatch.id} or manually override winner to clear the bracket.`,
        relatedEntityId: delayedMatch.id
      })
    }
  })

  return recommendations
}

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

export const explainWithAI = async (recommendation: Recommendation, apiKey?: string): Promise<string> => {
  if (!apiKey) return templateExplanation(recommendation.reasoning)

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      }
    )

    if (!response.ok) return templateExplanation(recommendation.reasoning)
    const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? templateExplanation(recommendation.reasoning)
  } catch {
    return templateExplanation(recommendation.reasoning)
  }
}

const templateExplanation = (reasoning: string[]): string => `${reasoning.map(reason => reason.trim().replace(/\.$/, '')).join(' and ')}.`

const inferAlertZone = (message: string): string => {
  const upper = message.toUpperCase()
  if (upper.includes('GATE B') || upper.includes('WEST')) return 'SECTOR GATE B (WEST)'
  if (upper.includes('GATE A') || upper.includes('EAST')) return 'SECTOR GATE A (EAST)'
  if (upper.includes('VIP')) return 'VIP HOSPITALITY SUITES'
  if (upper.includes('CONCOURSE')) return 'MAIN CONCOURSE'
  if (upper.includes('CAR PARK') || upper.includes('NORTH')) return 'NORTH CAR PARK'
  return 'GENERAL STADIUM AREA'
}
