import type { Faction, GameState, Clearing, PlayerState } from '@/lib/types'
import { CLEARINGS_DEF } from '@/lib/game/map'
import { createShuffledDeck, dealCards } from '@/lib/game/cards'

// ============================================================
// Starting piece placement per Root rules
// ============================================================

function buildEmptyClearings(): Record<string, Clearing> {
  const clearings: Record<string, Clearing> = {}
  for (const [id, def] of Object.entries(CLEARINGS_DEF)) {
    clearings[id] = {
      suit: def.suit,
      slots: def.slots,
      adj: def.adj,
      warriors: {},
      buildings: Array(def.slots).fill(null),
      tokens: [],
    }
  }
  return clearings
}

function placeMarquise(
  state: GameState,
  userId: string,
  deck: string[]
): { state: GameState; deck: string[] } {
  // Place 1 warrior in every clearing, castle + keep in clearing 11
  for (const id of Object.keys(state.map.clearings)) {
    state.map.clearings[id].warriors.marquise = 1
  }
  // Remove 11 warriors (placed on board) from available
  state.players[userId].warriors_available = 25 - 12 // 25 total - 12 on board + 1 extra castle clearing

  // Castle in clearing 11
  state.map.clearings['11'].buildings[0] = { faction: 'marquise', type: 'castle' }
  // Keep token in clearing 11
  state.map.clearings['11'].tokens.push({ faction: 'marquise', type: 'keep' })
  // Extra warrior in 11
  state.map.clearings['11'].warriors.marquise = 2

  state.players[userId].warriors_available = 25 - 13 // 12 clearings + 1 extra

  const { hand, remainingDeck } = dealCards(deck, 3)
  state.players[userId].hand = hand

  state.players[userId].marquise = {
    sawmills_available: 6,
    recruiters_available: 6,
    workshops_available: 6,
    wood_tokens: 8,
  }

  return { state, deck: remainingDeck }
}

function placeEyrie(
  state: GameState,
  userId: string,
  deck: string[]
): { state: GameState; deck: string[] } {
  // 6 warriors + 1 roost in corner clearing 0
  state.map.clearings['0'].warriors.eyrie = 6
  state.map.clearings['0'].buildings[0] = { faction: 'eyrie', type: 'roost' }

  state.players[userId].warriors_available = 20 - 6
  state.players[userId].eyrie = {
    roosts_available: 7 - 1, // 7 total - 1 placed
    decree: { fox: [], rabbit: [], mouse: [], bird: [] },
    turmoil_count: 0,
    leader: 'commander',
    viziers: [],
  }

  const { hand, remainingDeck } = dealCards(deck, 3)
  state.players[userId].hand = hand

  // Give starting vizier (a bird card)
  // Bird viziers are added to the decree automatically
  // For setup, we give 2 bird cards as loyal viziers
  const birdVizier = ['bir_03']
  state.players[userId].eyrie!.viziers = birdVizier

  return { state, deck: remainingDeck }
}

function placeAlliance(
  state: GameState,
  userId: string,
  deck: string[]
): { state: GameState; deck: string[] } {
  // Alliance starts with no pieces on the board — only supporters in hand
  state.players[userId].warriors_available = 10
  state.players[userId].alliance = {
    supporters: [],
    bases_available: { fox: 1, rabbit: 1, mouse: 1 },
    sympathy_tokens: 10,
    officers: 0,
  }

  const { hand, remainingDeck } = dealCards(deck, 3)
  state.players[userId].hand = hand

  // Top 3 cards from deck go to supporters
  const { hand: supporters, remainingDeck: deckAfter } = dealCards(remainingDeck, 3)
  state.players[userId].alliance!.supporters = supporters

  return { state, deck: deckAfter }
}

function placeVagabond(
  state: GameState,
  userId: string,
  deck: string[]
): { state: GameState; deck: string[] } {
  // Pawn placed in clearing 7 (corner)
  state.map.clearings['7'].tokens.push({ faction: 'vagabond', type: 'keep' }) // using keep as pawn placeholder

  state.players[userId].warriors_available = 0 // vagabond has no warriors
  state.players[userId].vagabond = {
    character: 'thief',
    items: [
      { type: 'boots', exhausted: false, damaged: false },
      { type: 'boots', exhausted: false, damaged: false },
      { type: 'torch', exhausted: false, damaged: false },
      { type: 'sword', exhausted: false, damaged: false },
    ],
    relations: {},
    quests_completed: 0,
  }

  const { hand, remainingDeck } = dealCards(deck, 3)
  state.players[userId].hand = hand

  return { state, deck: remainingDeck }
}

// ============================================================
// Main initializer
// ============================================================

export function initGameState(
  players: Array<{ userId: string; faction: Faction }>
): GameState {
  let deck = createShuffledDeck()

  // Build base state
  const state: GameState = {
    map: {
      clearings: buildEmptyClearings(),
      forests: {},
    },
    players: {},
    player_order: players.map(p => p.userId),
    deck,
    discard: [],
    current_player: players[0].userId,
    phase: 'birdsong',
    actions_remaining: 0,
    turn_number: 1,
    item_supply: {
      boots: 4,
      sword: 2,
      crossbow: 1,
      hammer: 1,
      torch: 1,
      tea: 2,
      coins: 3,
      bag: 3,
    },
  }

  // Init player state shells
  for (const { userId, faction } of players) {
    state.players[userId] = {
      faction,
      vp: 0,
      hand: [],
      warriors_available: 0,
    }
  }

  // Place pieces for each faction
  for (const { userId, faction } of players) {
    let result: { state: GameState; deck: string[] }
    switch (faction) {
      case 'marquise':
        result = placeMarquise(state, userId, deck)
        break
      case 'eyrie':
        result = placeEyrie(state, userId, deck)
        break
      case 'alliance':
        result = placeAlliance(state, userId, deck)
        break
      case 'vagabond':
        result = placeVagabond(state, userId, deck)
        break
    }
    deck = result.deck
    Object.assign(state, result.state)
  }

  state.deck = deck

  return state
}

// ============================================================
// State filtering — remove private info before broadcasting
// ============================================================

export function filterStateForPlayer(state: GameState, userId: string): GameState {
  const filtered: GameState = JSON.parse(JSON.stringify(state))

  // Remove deck (server-only)
  filtered.deck = []

  // Hide other players' hand cards
  for (const [pid, player] of Object.entries(filtered.players)) {
    if (pid !== userId) {
      // Replace card IDs with count placeholders
      player.hand = Array(player.hand.length).fill('hidden')
      // Hide alliance supporters
      if (player.alliance) {
        player.alliance.supporters = Array(player.alliance.supporters.length).fill('hidden')
      }
    }
  }

  return filtered
}
