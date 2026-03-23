import type { Action, ActionResult, Faction, GameState } from '@/lib/types'
import { canMove, getRuler } from '@/lib/game/map'
import { drawCard } from '@/lib/game/cards'
import { filterStateForPlayer } from '@/lib/game/setup'
import { getAvailableActionsForFaction } from '@/lib/game/engine'

// ============================================================
// Battle
// ============================================================

function rollDie(): number {
  return Math.floor(Math.random() * 4) // 0-3
}

function handleBattle(
  state: GameState,
  payload: Record<string, unknown>,
  userId: string
): ActionResult {
  const { clearingId, defenderId } = payload as { clearingId: string; defenderId: string }

  if (!clearingId || !defenderId) {
    return { ok: false, error: 'Battle requires clearingId and defenderId' }
  }

  const clearing = state.map.clearings[clearingId]
  if (!clearing) return { ok: false, error: 'Invalid clearing' }

  const attacker = state.players[userId]
  const defender = state.players[defenderId]
  if (!attacker || !defender) return { ok: false, error: 'Invalid players' }

  const attackerFaction = attacker.faction
  const defenderFaction = defender.faction

  const attackerPieces = clearing.warriors[attackerFaction] ?? 0
  const defenderPieces = clearing.warriors[defenderFaction] ?? 0

  if (attackerPieces === 0) return { ok: false, error: 'No warriors to attack with' }

  // Roll dice
  const d1 = rollDie()
  const d2 = rollDie()
  const attackerRoll = Math.max(d1, d2)
  const defenderRoll = Math.min(d1, d2)

  // Hits capped by pieces
  const attackerHits = Math.min(attackerRoll, defenderPieces)
  const defenderHits = Math.min(defenderRoll, attackerPieces)

  // Remove warriors
  const newState: GameState = JSON.parse(JSON.stringify(state))
  newState.map.clearings[clearingId].warriors[defenderFaction] = Math.max(0, defenderPieces - attackerHits)
  newState.map.clearings[clearingId].warriors[attackerFaction] = Math.max(0, attackerPieces - defenderHits)

  // Restore warriors to supply
  newState.players[userId].warriors_available += defenderHits
  newState.players[defenderId].warriors_available += attackerHits

  // Score VP for attacker: 1 per building/token removed
  // (simplified — full rule: score when enemy buildings removed from clearings)
  const buildingsRemoved = attackerHits > 0 ? 1 : 0 // simplified scoring
  newState.players[userId].vp += buildingsRemoved

  newState.actions_remaining -= 1

  return { ok: true, newState }
}

// ============================================================
// Move
// ============================================================

function handleMove(
  state: GameState,
  payload: Record<string, unknown>,
  userId: string
): ActionResult {
  const { fromId, toId, count } = payload as { fromId: string; toId: string; count: number }

  if (!fromId || !toId || !count) {
    return { ok: false, error: 'Move requires fromId, toId, count' }
  }

  const faction = state.players[userId].faction

  if (!canMove(fromId, toId, faction, state)) {
    return { ok: false, error: 'Illegal move — check adjacency and rule requirement' }
  }

  const available = state.map.clearings[fromId].warriors[faction] ?? 0
  if (count > available) {
    return { ok: false, error: `Only ${available} warriors available in clearing ${fromId}` }
  }

  const newState: GameState = JSON.parse(JSON.stringify(state))
  newState.map.clearings[fromId].warriors[faction] = available - count
  newState.map.clearings[toId].warriors[faction] = (newState.map.clearings[toId].warriors[faction] ?? 0) + count
  newState.actions_remaining -= 1

  return { ok: true, newState }
}

// ============================================================
// Build (Marquise)
// ============================================================

function handleBuild(
  state: GameState,
  payload: Record<string, unknown>,
  userId: string
): ActionResult {
  const { clearingId, buildingType } = payload as { clearingId: string; buildingType: string }
  const faction = state.players[userId].faction

  if (faction !== 'marquise') return { ok: false, error: 'Only Marquise can BUILD' }
  if (!['sawmill', 'recruiter', 'workshop'].includes(buildingType)) {
    return { ok: false, error: 'Invalid building type for Marquise' }
  }

  const clearing = state.map.clearings[clearingId]
  if (!clearing) return { ok: false, error: 'Invalid clearing' }

  // Must rule the clearing
  const ruler = getRuler(clearingId, state)
  if (ruler !== 'marquise') return { ok: false, error: 'Marquise must rule clearing to build' }

  // Find empty slot
  const emptySlot = clearing.buildings.findIndex(b => b === null)
  if (emptySlot === -1) return { ok: false, error: 'No empty building slots' }

  // Wood cost: sawmill/recruiter = 1 wood, workshop = 2 wood
  const woodCost = buildingType === 'workshop' ? 2 : 1

  // Count adjacent wood tokens
  const adjacentIds = [clearingId, ...clearing.adj]
  let woodAvailable = 0
  for (const cId of adjacentIds) {
    woodAvailable += state.map.clearings[cId]?.tokens.filter(
      t => t.faction === 'marquise' && t.type === 'wood'
    ).length ?? 0
  }

  if (woodAvailable < woodCost) return { ok: false, error: `Need ${woodCost} wood tokens nearby` }

  const newState: GameState = JSON.parse(JSON.stringify(state))

  // Remove wood tokens
  let woodToRemove = woodCost
  for (const cId of adjacentIds) {
    if (woodToRemove === 0) break
    const tokens = newState.map.clearings[cId].tokens
    for (let i = tokens.length - 1; i >= 0 && woodToRemove > 0; i--) {
      if (tokens[i].faction === 'marquise' && tokens[i].type === 'wood') {
        tokens.splice(i, 1)
        woodToRemove--
        newState.players[userId].marquise!.wood_tokens++
      }
    }
  }

  // Place building
  newState.map.clearings[clearingId].buildings[emptySlot] = {
    faction: 'marquise',
    type: buildingType as 'sawmill' | 'recruiter' | 'workshop',
  }

  // Score VP — count how many of this building type are now placed
  const totalBuilt = Object.values(newState.map.clearings).reduce((acc, c) => {
    return acc + c.buildings.filter(b => b?.faction === 'marquise' && b.type === buildingType).length
  }, 0)
  const vpTrack = [0, 1, 2, 3, 4, 5]
  newState.players[userId].vp += vpTrack[Math.min(totalBuilt, 5)] - vpTrack[Math.min(totalBuilt - 1, 4)]

  newState.actions_remaining -= 1

  return { ok: true, newState }
}

// ============================================================
// Recruit (Marquise)
// ============================================================

function handleRecruit(
  state: GameState,
  payload: Record<string, unknown>,
  userId: string
): ActionResult {
  const faction = state.players[userId].faction
  if (faction !== 'marquise') return { ok: false, error: 'Only Marquise uses RECRUIT' }

  const newState: GameState = JSON.parse(JSON.stringify(state))

  // Place 1 warrior at each recruiter in clearings Marquise rules
  let placed = 0
  for (const [cId, clearing] of Object.entries(newState.map.clearings)) {
    const hasRecruiter = clearing.buildings.some(b => b?.faction === 'marquise' && b.type === 'recruiter')
    if (hasRecruiter && getRuler(cId, state) === 'marquise') {
      if (newState.players[userId].warriors_available > 0) {
        clearing.warriors.marquise = (clearing.warriors.marquise ?? 0) + 1
        newState.players[userId].warriors_available--
        placed++
      }
    }
  }

  if (placed === 0) return { ok: false, error: 'No recruiters in ruled clearings' }

  newState.actions_remaining -= 1
  return { ok: true, newState }
}

// ============================================================
// Place Wood (Marquise Birdsong)
// ============================================================

function handlePlaceWood(state: GameState, userId: string): ActionResult {
  const faction = state.players[userId].faction
  if (faction !== 'marquise') return { ok: false, error: 'Only Marquise places wood' }

  const newState: GameState = JSON.parse(JSON.stringify(state))
  let placed = 0

  for (const [cId, clearing] of Object.entries(newState.map.clearings)) {
    const hasSawmill = clearing.buildings.some(b => b?.faction === 'marquise' && b.type === 'sawmill')
    if (hasSawmill && newState.players[userId].marquise!.wood_tokens > 0) {
      clearing.tokens.push({ faction: 'marquise', type: 'wood' })
      newState.players[userId].marquise!.wood_tokens--
      placed++
    }
  }

  // Move to daylight after birdsong
  newState.phase = 'daylight'
  newState.actions_remaining = 3 // Marquise gets 3 actions in daylight

  return { ok: true, newState }
}

// ============================================================
// End Turn
// ============================================================

function handleEndTurn(state: GameState, userId: string): ActionResult {
  const newState: GameState = JSON.parse(JSON.stringify(state))

  // Evening — draw cards
  const player = newState.players[userId]
  const faction = player.faction

  // Count cards to draw based on faction
  let cardsToDraw = 1
  if (faction === 'marquise') {
    // 1 + 1 per fox clearing ruled
    const foxRuled = Object.entries(newState.map.clearings).filter(
      ([cId, c]) => c.suit === 'fox' && getRuler(cId, state) === 'marquise'
    ).length
    cardsToDraw = 1 + foxRuled
  }

  for (let i = 0; i < cardsToDraw; i++) {
    const { card, deck } = drawCard(newState.deck)
    if (card) {
      player.hand.push(card)
      newState.deck = deck
    }
  }

  // Hand limit: 5 cards — discard excess (simplified: keep newest)
  while (player.hand.length > 5) {
    const discarded = player.hand.shift()!
    newState.discard.push(discarded)
  }

  // Advance to next player
  const playerOrder = newState.player_order
  const currentIdx = playerOrder.indexOf(userId)
  const nextIdx = (currentIdx + 1) % playerOrder.length
  newState.current_player = playerOrder[nextIdx]

  if (nextIdx === 0) {
    newState.turn_number++
  }

  // Reset phase for next player
  newState.phase = 'birdsong'
  newState.actions_remaining = 0

  return { ok: true, newState }
}

// ============================================================
// Main action dispatcher
// ============================================================

export function applyAction(state: GameState, action: Action, userId: string): ActionResult {
  // Validate it's this player's turn
  if (state.current_player !== userId) {
    return { ok: false, error: 'Not your turn' }
  }

  const faction = state.players[userId]?.faction
  if (!faction) return { ok: false, error: 'Player not found' }

  const payload = action.payload ?? {}

  switch (action.type) {
    case 'MOVE':
      return handleMove(state, payload, userId)
    case 'BATTLE':
      return handleBattle(state, payload, userId)
    case 'BUILD':
      return handleBuild(state, payload, userId)
    case 'RECRUIT':
      return handleRecruit(state, payload, userId)
    case 'PLACE_WOOD':
      return handlePlaceWood(state, userId)
    case 'END_TURN':
      return handleEndTurn(state, userId)
    case 'CRAFT':
      // Simplified: not fully implemented
      return { ok: false, error: 'Craft not yet implemented' }
    default:
      return { ok: false, error: `Unknown action type: ${action.type}` }
  }
}

export { filterStateForPlayer }
