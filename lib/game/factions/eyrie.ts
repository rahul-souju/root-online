/**
 * Eyrie Dynasties — Faction Module
 *
 * The proud birds of the Eyrie. They rule through their Decree — a growing set
 * of commands that must be fulfilled each turn or they fall into Turmoil.
 */
import type { AvailableAction, GameState, EyrieDecree } from '@/lib/types'
import { getRuler, getMovableClearings } from '@/lib/game/map'
import { drawCard } from '@/lib/game/cards'

export const FACTION_NAME = 'Eyrie Dynasties'
export const FACTION_COLOR = '#4A90D9'   // royal blue
export const FACTION_DESCRIPTION =
  'Noble birds executing their ever-growing Decree. Score VP by placing roosts, ' +
  'but beware Turmoil if you cannot fulfill your Decree.'

export const LEADERS = {
  builder:     { bonus: 'Draw 2 extra cards in evening' },
  charismatic: { bonus: 'Recruit 2 warriors at each roost' },
  commander:   { bonus: 'Take 1 extra battle' },
  despot:      { bonus: 'Score 1 VP when removing enemy pieces' },
}

// VP track for roosts
const ROOST_VP = [0, 4, 1, 1, 1, 1, 1]  // VP per Nth roost placed

export function setup(state: GameState, userId: string): GameState {
  return state
}

export function getBirdsongActions(state: GameState, userId: string): AvailableAction[] {
  return [
    { type: 'EYRIE_RESOLVE_DECREE', label: 'Resolve Decree', auto: true },
  ]
}

export function getDaylightActions(state: GameState, userId: string): AvailableAction[] {
  const actions: AvailableAction[] = []

  // Add to Decree
  actions.push({ type: 'EYRIE_ADD_TO_DECREE', label: 'Add Card to Decree' })

  // Move
  if (getMovableClearings('eyrie', state).length > 0) {
    actions.push({ type: 'MOVE', label: 'Move', requiresTarget: true })
  }

  // Battle
  const canBattle = Object.entries(state.map.clearings).some(([, c]) => {
    return (c.warriors.eyrie ?? 0) > 0 &&
      Object.entries(c.warriors).some(([f, w]) => f !== 'eyrie' && (w ?? 0) > 0)
  })
  if (canBattle) {
    actions.push({ type: 'BATTLE', label: 'Battle', requiresTarget: true })
  }

  // Build roost
  const canBuildRoost = Object.entries(state.map.clearings).some(([cId, c]) => {
    return (c.warriors.eyrie ?? 0) >= 1 &&
      c.buildings.some(b => b === null) &&
      !c.buildings.some(b => b?.faction === 'eyrie' && b.type === 'roost')
  })
  if (canBuildRoost) {
    actions.push({ type: 'BUILD', label: 'Build Roost', requiresTarget: true })
  }

  actions.push({ type: 'END_TURN', label: 'End Turn' })
  return actions
}

export function getRoostVP(totalNow: number): number {
  return ROOST_VP[Math.min(totalNow, ROOST_VP.length - 1)] ?? 0
}

/**
 * Check if the Eyrie can fulfill their current Decree.
 * Returns an object indicating which parts they can and cannot fulfill.
 */
export function canFulfillDecree(state: GameState, userId: string): {
  canFulfill: boolean
  missingActions: string[]
} {
  const eyrie = state.players[userId]?.eyrie
  if (!eyrie) return { canFulfill: false, missingActions: ['No eyrie state'] }

  const missingActions: string[] = []
  // Simplified check — full decree resolution requires complex validation
  // For now, always allow but track turmoil count
  return { canFulfill: true, missingActions }
}
