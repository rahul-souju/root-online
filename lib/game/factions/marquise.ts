/**
 * Marquise de Cat — Faction Module
 *
 * The industrial cats of the forest. They start with pieces everywhere and
 * score VP by building sawmills, recruiters, and workshops.
 */
import type { AvailableAction, GameState } from '@/lib/types'
import { getRuler, getMovableClearings } from '@/lib/game/map'

export const FACTION_NAME = 'Marquise de Cat'
export const FACTION_COLOR = '#B5451B'   // clay red
export const FACTION_DESCRIPTION =
  'Industrious cats that rule through buildings. Score VP by constructing sawmills, ' +
  'recruiters, and workshops across the woodland.'

// VP tracks — each building type has its own track
export const VP_TRACKS: Record<string, number[]> = {
  sawmill:   [0, 1, 2, 3, 3, 4],  // VP per Nth sawmill placed
  recruiter: [0, 1, 1, 2, 2, 3],
  workshop:  [0, 2, 2, 3, 3, 4],
}

export function setup(state: GameState, userId: string): GameState {
  // Already handled by initGameState in setup.ts
  return state
}

export function getBirdsongActions(state: GameState, userId: string): AvailableAction[] {
  return [
    { type: 'PLACE_WOOD', label: 'Place Wood at each Sawmill', auto: true },
  ]
}

export function getDaylightActions(state: GameState, userId: string): AvailableAction[] {
  const { actions_remaining } = state
  if (actions_remaining <= 0) return [{ type: 'END_TURN', label: 'End Turn' }]

  const actions: AvailableAction[] = []

  // Move
  if (getMovableClearings('marquise', state).length > 0) {
    actions.push({ type: 'MOVE', label: 'March (Move Warriors)', requiresTarget: true })
  }

  // Battle
  const canBattle = Object.entries(state.map.clearings).some(([, c]) => {
    return (c.warriors.marquise ?? 0) > 0 &&
      Object.entries(c.warriors).some(([f, w]) => f !== 'marquise' && (w ?? 0) > 0)
  })
  if (canBattle) {
    actions.push({ type: 'BATTLE', label: 'Battle', requiresTarget: true })
  }

  // Build
  const canBuild = Object.entries(state.map.clearings).some(([cId, c]) => {
    return getRuler(cId, state) === 'marquise' && c.buildings.some(b => b === null)
  })
  if (canBuild) {
    actions.push({ type: 'BUILD', label: 'Build', requiresTarget: true })
  }

  // Recruit
  const canRecruit = Object.entries(state.map.clearings).some(([cId, c]) => {
    return getRuler(cId, state) === 'marquise' &&
      c.buildings.some(b => b?.faction === 'marquise' && b.type === 'recruiter')
  })
  if (canRecruit) {
    actions.push({ type: 'RECRUIT', label: 'Recruit Warriors' })
  }

  actions.push({ type: 'END_TURN', label: 'End Turn' })
  return actions
}

export function getEveningActions(state: GameState, userId: string): AvailableAction[] {
  // Draw 1 card + 1 per fox clearing ruled — handled in END_TURN action
  return [{ type: 'END_TURN', label: 'End Turn (Draw Cards)' }]
}

/**
 * Count how many of a building type the Marquise has placed.
 */
export function countBuildings(state: GameState, buildingType: string): number {
  return Object.values(state.map.clearings).reduce((acc, c) => {
    return acc + c.buildings.filter(b => b?.faction === 'marquise' && b.type === buildingType).length
  }, 0)
}

/**
 * VP gained from placing the Nth building of a type.
 */
export function getBuildingVP(buildingType: string, totalNow: number): number {
  const track = VP_TRACKS[buildingType]
  if (!track) return 0
  return (track[Math.min(totalNow, track.length - 1)] ?? 0) -
         (track[Math.min(totalNow - 1, track.length - 1)] ?? 0)
}
