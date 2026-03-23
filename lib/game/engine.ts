import type { AvailableAction, Faction, GameState } from '@/lib/types'
import { getRuler, getMovableClearings } from '@/lib/game/map'

/**
 * Returns the list of valid actions for the current player based on game phase and faction.
 * Used by the UI to render the action panel.
 */
export function getAvailableActionsForFaction(
  state: GameState,
  userId: string
): AvailableAction[] {
  const player = state.players[userId]
  if (!player) return []

  const { faction } = player
  const { phase, actions_remaining } = state

  switch (faction) {
    case 'marquise':
      return getMarquiseActions(state, userId, phase, actions_remaining)
    case 'eyrie':
      return getEyrieActions(state, userId, phase, actions_remaining)
    case 'alliance':
      return getAllianceActions(state, userId, phase, actions_remaining)
    case 'vagabond':
      return getVagabondActions(state, userId, phase, actions_remaining)
  }
}

function getMarquiseActions(
  state: GameState,
  userId: string,
  phase: string,
  actionsRemaining: number
): AvailableAction[] {
  const actions: AvailableAction[] = []

  if (phase === 'birdsong') {
    actions.push({ type: 'PLACE_WOOD', label: 'Place Wood (Birdsong)', auto: true })
    return actions
  }

  if (phase === 'daylight' && actionsRemaining > 0) {
    // Move: always available if has warriors to move
    if (getMovableClearings('marquise', state).length > 0) {
      actions.push({ type: 'MOVE', label: 'March (Move Warriors)', requiresTarget: true })
    }

    // Battle: if has warriors in a clearing with enemies
    const canBattle = Object.entries(state.map.clearings).some(([, c]) => {
      const hasMarquise = (c.warriors.marquise ?? 0) > 0
      const hasEnemy = Object.entries(c.warriors).some(
        ([f, w]) => f !== 'marquise' && (w ?? 0) > 0
      )
      return hasMarquise && hasEnemy
    })
    if (canBattle) {
      actions.push({ type: 'BATTLE', label: 'Battle', requiresTarget: true })
    }

    // Build: if rules a clearing with an empty slot
    const canBuild = Object.entries(state.map.clearings).some(([cId, c]) => {
      return getRuler(cId, state) === 'marquise' && c.buildings.some(b => b === null)
    })
    if (canBuild) {
      actions.push({ type: 'BUILD', label: 'Build', requiresTarget: true })
    }

    // Recruit: if has a recruiter in a ruled clearing
    const canRecruit = Object.entries(state.map.clearings).some(([cId, c]) => {
      return getRuler(cId, state) === 'marquise' &&
        c.buildings.some(b => b?.faction === 'marquise' && b.type === 'recruiter')
    })
    if (canRecruit) {
      actions.push({ type: 'RECRUIT', label: 'Recruit Warriors' })
    }
  }

  if (phase === 'daylight' || phase === 'evening') {
    actions.push({ type: 'END_TURN', label: 'End Turn' })
  }

  return actions
}

function getEyrieActions(
  state: GameState,
  userId: string,
  phase: string,
  actionsRemaining: number
): AvailableAction[] {
  const actions: AvailableAction[] = []

  if (phase === 'birdsong') {
    actions.push({ type: 'EYRIE_RESOLVE_DECREE', label: 'Resolve Decree (Birdsong)', auto: true })
    return actions
  }

  if (phase === 'daylight') {
    if (getMovableClearings('eyrie', state).length > 0) {
      actions.push({ type: 'MOVE', label: 'Move', requiresTarget: true })
    }
    actions.push({ type: 'BATTLE', label: 'Battle', requiresTarget: true })
    actions.push({ type: 'EYRIE_ADD_TO_DECREE', label: 'Add to Decree' })
  }

  actions.push({ type: 'END_TURN', label: 'End Turn' })
  return actions
}

function getAllianceActions(
  state: GameState,
  userId: string,
  phase: string,
  actionsRemaining: number
): AvailableAction[] {
  const actions: AvailableAction[] = []

  if (phase === 'birdsong') {
    actions.push({ type: 'ALLIANCE_SYMPATHY', label: 'Spread Sympathy (Birdsong)', requiresTarget: true })
    return actions
  }

  if (phase === 'daylight') {
    actions.push({ type: 'ALLIANCE_MOBILIZE', label: 'Mobilize (Discard to Supporters)' })
    actions.push({ type: 'ALLIANCE_TRAIN', label: 'Train Officers' })
    if (getMovableClearings('alliance', state).length > 0) {
      actions.push({ type: 'MOVE', label: 'Move', requiresTarget: true })
    }
    actions.push({ type: 'BATTLE', label: 'Battle', requiresTarget: true })
  }

  actions.push({ type: 'END_TURN', label: 'End Turn' })
  return actions
}

function getVagabondActions(
  state: GameState,
  userId: string,
  phase: string,
  actionsRemaining: number
): AvailableAction[] {
  const actions: AvailableAction[] = []

  if (phase === 'birdsong') {
    actions.push({ type: 'VAGABOND_REPAIR', label: 'Refresh Items (Birdsong)', auto: true })
    return actions
  }

  if (phase === 'daylight') {
    actions.push({ type: 'VAGABOND_MOVE', label: 'Slip (Move)', requiresTarget: true })
    actions.push({ type: 'VAGABOND_EXPLORE', label: 'Explore', requiresTarget: true })
    actions.push({ type: 'VAGABOND_AID', label: 'Aid' })
    actions.push({ type: 'VAGABOND_QUEST', label: 'Quest' })
    actions.push({ type: 'VAGABOND_STRIKE', label: 'Strike', requiresTarget: true })
    actions.push({ type: 'BATTLE', label: 'Battle', requiresTarget: true })
  }

  actions.push({ type: 'END_TURN', label: 'End Turn' })
  return actions
}

/**
 * Check if any player has reached 30 VP (victory condition).
 */
export function checkVictory(state: GameState): string | null {
  for (const [userId, player] of Object.entries(state.players)) {
    if (player.vp >= 30) return userId
  }
  return null
}
