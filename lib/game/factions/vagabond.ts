/**
 * Vagabond — Faction Module
 *
 * The lone wanderer. Unlike other factions, the Vagabond has no warriors —
 * they operate through items, quests, and aiding other factions.
 */
import type { AvailableAction, GameState, VagabondItem } from '@/lib/types'

export const FACTION_NAME = 'Vagabond'
export const FACTION_COLOR = '#6B5B45'   // earthy brown
export const FACTION_DESCRIPTION =
  'A lone wanderer roaming the woodland. Score VP by completing quests, ' +
  'aiding factions, and exploring ruins.'

export const CHARACTERS = {
  thief:   { items: ['boots', 'boots', 'torch', 'sword'],   ability: 'Steal a card when entering hostile clearing' },
  tinker:  { items: ['boots', 'hammer', 'torch', 'coins'],  ability: 'Take 1 card when aiding' },
  ranger:  { items: ['boots', 'crossbow', 'torch', 'sword'], ability: 'Ignore enemies when moving' },
}

// Items that can be found in forests / ruins
export const ITEM_SUPPLY_ITEMS = ['boots', 'sword', 'crossbow', 'hammer', 'torch', 'tea', 'coins', 'bag']

export function setup(state: GameState, userId: string): GameState {
  return state
}

export function getBirdsongActions(state: GameState, userId: string): AvailableAction[] {
  const vagabond = state.players[userId]?.vagabond
  if (!vagabond) return []

  // Refresh (un-exhaust) items
  const exhaustedCount = vagabond.items.filter(i => i.exhausted && !i.damaged).length
  return [
    {
      type: 'VAGABOND_REPAIR',
      label: `Refresh Items (${exhaustedCount} exhausted)`,
      auto: true,
    },
  ]
}

export function getDaylightActions(state: GameState, userId: string): AvailableAction[] {
  const vagabond = state.players[userId]?.vagabond
  if (!vagabond) return []

  const actions: AvailableAction[] = []

  // Move (uses boots)
  const hasBoots = vagabond.items.some(i => i.type === 'boots' && !i.exhausted && !i.damaged)
  if (hasBoots) {
    actions.push({ type: 'VAGABOND_MOVE', label: 'Slip (Move)', requiresTarget: true })
  }

  // Explore (uses torch — find items in ruins)
  const hasTorch = vagabond.items.some(i => i.type === 'torch' && !i.exhausted && !i.damaged)
  if (hasTorch) {
    actions.push({ type: 'VAGABOND_EXPLORE', label: 'Explore (Find Item)', requiresTarget: true })
  }

  // Aid — give a card to a player in same clearing
  if ((state.players[userId].hand.length ?? 0) > 0) {
    actions.push({ type: 'VAGABOND_AID', label: 'Aid a Player' })
  }

  // Quest — complete an active quest
  actions.push({ type: 'VAGABOND_QUEST', label: 'Complete Quest' })

  // Strike — attack 1 warrior (uses sword)
  const hasSword = vagabond.items.some(i => i.type === 'sword' && !i.exhausted && !i.damaged)
  if (hasSword) {
    actions.push({ type: 'VAGABOND_STRIKE', label: 'Strike (Remove 1 Warrior)', requiresTarget: true })
  }

  // Battle (uses sword for extra hits — simplified)
  actions.push({ type: 'BATTLE', label: 'Battle', requiresTarget: true })

  actions.push({ type: 'END_TURN', label: 'End Turn' })
  return actions
}

export function countReadyItems(vagabond: { items: VagabondItem[] }, type: string): number {
  return vagabond.items.filter(i => i.type === type && !i.exhausted && !i.damaged).length
}

export function refreshItems(state: GameState, userId: string): GameState {
  const newState: GameState = JSON.parse(JSON.stringify(state))
  const vagabond = newState.players[userId]?.vagabond
  if (!vagabond) return newState

  // Un-exhaust all non-damaged items (3 items per birdsong by default)
  let refreshed = 0
  for (const item of vagabond.items) {
    if (item.exhausted && !item.damaged && refreshed < 3) {
      item.exhausted = false
      refreshed++
    }
  }

  return newState
}
