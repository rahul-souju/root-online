import type { Faction, GameState, Suit } from '@/lib/types'

// ============================================================
// Standard Fall Map — 12 clearings (0-11)
// ============================================================

export const CLEARINGS_DEF: Record<string, { suit: Suit; slots: number; adj: string[] }> = {
  '0':  { suit: 'fox',    slots: 2, adj: ['1', '5', '3'] },
  '1':  { suit: 'rabbit', slots: 1, adj: ['0', '2', '5'] },
  '2':  { suit: 'mouse',  slots: 2, adj: ['1', '3', '8'] },
  '3':  { suit: 'rabbit', slots: 2, adj: ['0', '2', '4', '9'] },
  '4':  { suit: 'fox',    slots: 3, adj: ['3', '5', '9', '11'] },
  '5':  { suit: 'mouse',  slots: 2, adj: ['0', '1', '4', '6'] },
  '6':  { suit: 'rabbit', slots: 3, adj: ['5', '7', '10', '11'] },
  '7':  { suit: 'fox',    slots: 2, adj: ['6', '8'] },
  '8':  { suit: 'mouse',  slots: 2, adj: ['2', '7', '9'] },
  '9':  { suit: 'fox',    slots: 2, adj: ['3', '4', '8', '10'] },
  '10': { suit: 'mouse',  slots: 2, adj: ['6', '9', '11'] },
  '11': { suit: 'rabbit', slots: 2, adj: ['4', '6', '10'] },
}

// SVG positions for each clearing on the board (viewBox 800x600)
export const CLEARING_POSITIONS: Record<string, { x: number; y: number }> = {
  '0':  { x: 120, y: 80  },
  '1':  { x: 280, y: 80  },
  '2':  { x: 440, y: 80  },
  '3':  { x: 320, y: 200 },
  '4':  { x: 160, y: 300 },
  '5':  { x: 200, y: 180 },
  '6':  { x: 350, y: 380 },
  '7':  { x: 560, y: 200 },
  '8':  { x: 560, y: 340 },
  '9':  { x: 440, y: 280 },
  '10': { x: 500, y: 450 },
  '11': { x: 220, y: 450 },
}

// Faction corner starting clearings
export const FACTION_START_CLEARINGS: Partial<Record<Faction, string>> = {
  marquise: '11',
  eyrie:    '0',
  vagabond: '7',
}

// ============================================================
// Helpers
// ============================================================

export function getAdjacentClearings(clearingId: string): string[] {
  return CLEARINGS_DEF[clearingId]?.adj ?? []
}

export function areAdjacent(a: string, b: string): boolean {
  return CLEARINGS_DEF[a]?.adj.includes(b) ?? false
}

/**
 * Returns the faction that "rules" a clearing (most warriors + buildings).
 * Returns null if there is a tie or no pieces.
 */
export function getRuler(clearingId: string, state: GameState): Faction | null {
  const clearing = state.map.clearings[clearingId]
  if (!clearing) return null

  const counts: Partial<Record<Faction, number>> = {}
  const factions: Faction[] = ['marquise', 'eyrie', 'alliance', 'vagabond']

  for (const f of factions) {
    const warriors = clearing.warriors[f] ?? 0
    const buildings = clearing.buildings.filter(b => b?.faction === f).length
    counts[f] = warriors + buildings
  }

  let best: Faction | null = null
  let bestScore = 0
  let tie = false

  for (const [f, score] of Object.entries(counts) as [Faction, number][]) {
    if (score > bestScore) {
      bestScore = score
      best = f
      tie = false
    } else if (score === bestScore && score > 0) {
      tie = true
    }
  }

  return tie ? null : best
}

/**
 * Whether faction "rules" a given clearing (is the ruler or tied for top).
 */
export function rulesClearing(clearingId: string, faction: Faction, state: GameState): boolean {
  const ruler = getRuler(clearingId, state)
  if (ruler === faction) return true
  // Also rules if tied — tie means nobody strictly rules, so check if faction is >=
  const clearing = state.map.clearings[clearingId]
  if (!clearing) return false
  const fScore = (clearing.warriors[faction] ?? 0) +
    clearing.buildings.filter(b => b?.faction === faction).length
  if (fScore === 0) return false
  const factions: Faction[] = ['marquise', 'eyrie', 'alliance', 'vagabond']
  return factions.every(f => {
    if (f === faction) return true
    const other = (clearing.warriors[f] ?? 0) +
      clearing.buildings.filter(b => b?.faction === f).length
    return fScore >= other
  })
}

/**
 * Movement validation per Root rules.
 * A faction can move between adjacent clearings if they rule either the source or destination.
 * Vagabond is exempt from the rule requirement.
 */
export function canMove(
  fromId: string,
  toId: string,
  faction: Faction,
  state: GameState
): boolean {
  if (!areAdjacent(fromId, toId)) return false
  if (faction === 'vagabond') return true
  return rulesClearing(fromId, faction, state) || rulesClearing(toId, faction, state)
}

/**
 * Returns all clearings that a faction can legally move warriors FROM to another clearing.
 */
export function getMovableClearings(faction: Faction, state: GameState): string[] {
  return Object.keys(state.map.clearings).filter(cId => {
    const warriors = state.map.clearings[cId].warriors[faction] ?? 0
    if (warriors === 0) return false
    return getAdjacentClearings(cId).some(adj => canMove(cId, adj, faction, state))
  })
}

/**
 * Returns all clearings a faction can move TO from a given source clearing.
 */
export function getMoveTargets(fromId: string, faction: Faction, state: GameState): string[] {
  return getAdjacentClearings(fromId).filter(toId => canMove(fromId, toId, faction, state))
}
