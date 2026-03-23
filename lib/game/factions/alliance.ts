/**
 * Woodland Alliance — Faction Module
 *
 * The rebel faction. They spread sympathy and foment outrage to gain supporters,
 * then leverage them to train officers and eventually revolt.
 */
import type { AvailableAction, GameState, Suit } from '@/lib/types'

export const FACTION_NAME = 'Woodland Alliance'
export const FACTION_COLOR = '#2D6A4F'   // forest green
export const FACTION_DESCRIPTION =
  'Rebels of the woodland, spreading sympathy across clearings. ' +
  'Score VP by placing sympathy tokens, with bonus VP in matching-suit clearings.'

// Sympathy VP track
const SYMPATHY_VP = [0, 1, 1, 1, 2, 2, 2, 3, 3, 4, 0]

export function getSympathyVP(totalNow: number): number {
  return SYMPATHY_VP[Math.min(totalNow, SYMPATHY_VP.length - 1)] ?? 0
}

export function getSympathyCost(state: GameState, userId: string, clearingId: string): number {
  const clearing = state.map.clearings[clearingId]
  const alliance = state.players[userId]?.alliance
  if (!alliance) return 999

  // Base cost: 1 supporter of clearing's suit, +1 per adjacent sympathy token
  let cost = 1
  const adjacent = clearing.adj
  for (const adjId of adjacent) {
    const hasSymp = state.map.clearings[adjId]?.tokens.some(
      t => t.faction === 'alliance' && t.type === 'sympathy'
    )
    if (hasSymp) cost++
  }
  return cost
}

export function setup(state: GameState, userId: string): GameState {
  return state
}

export function getBirdsongActions(state: GameState, userId: string): AvailableAction[] {
  return [
    { type: 'ALLIANCE_SYMPATHY', label: 'Spread Sympathy', requiresTarget: true },
  ]
}

export function getDaylightActions(state: GameState, userId: string): AvailableAction[] {
  const actions: AvailableAction[] = []

  actions.push({ type: 'ALLIANCE_MOBILIZE', label: 'Mobilize (Add to Supporters)' })
  actions.push({ type: 'ALLIANCE_TRAIN', label: 'Train Officers' })
  actions.push({ type: 'MOVE', label: 'Move', requiresTarget: true })
  actions.push({ type: 'BATTLE', label: 'Battle', requiresTarget: true })
  actions.push({ type: 'END_TURN', label: 'End Turn' })

  return actions
}

/**
 * Check if Alliance can revolt in a clearing (has a base, enough officers, enough supporters).
 */
export function canRevolt(state: GameState, userId: string, clearingId: string): boolean {
  const alliance = state.players[userId]?.alliance
  if (!alliance || alliance.officers === 0) return false

  const clearing = state.map.clearings[clearingId]
  const suit = clearing.suit as Suit

  // Need at least 2 supporters of the clearing's suit
  const suitSupporters = alliance.supporters.filter(cardId => {
    // Simplified — check if card ID starts with suit prefix
    return cardId.startsWith(suit.slice(0, 3)) || cardId.startsWith('bir')
  }).length

  return suitSupporters >= 2 && (alliance.bases_available[suit] ?? 0) > 0
}
