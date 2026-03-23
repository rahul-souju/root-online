import type { Card, Suit } from '@/lib/types'

// ============================================================
// 54-card shared deck (simplified Root card set)
// ============================================================

const FOX_CARDS: Card[] = [
  { id: 'fox_01', suit: 'fox', name: 'Ambush',        craft_cost: ['fox', 'fox'] },
  { id: 'fox_02', suit: 'fox', name: 'Anvil',         craft_cost: ['fox'],        item: 'sword' },
  { id: 'fox_03', suit: 'fox', name: 'Foxfolk',       craft_cost: ['fox'] },
  { id: 'fox_04', suit: 'fox', name: 'Builders',      craft_cost: ['fox', 'fox'], vp: 2 },
  { id: 'fox_05', suit: 'fox', name: 'Tax Collector',  craft_cost: ['fox'] },
  { id: 'fox_06', suit: 'fox', name: 'Woodland Runners', craft_cost: ['fox'] },
  { id: 'fox_07', suit: 'fox', name: 'Command Warren', craft_cost: ['fox', 'fox'] },
  { id: 'fox_08', suit: 'fox', name: 'Crossbow',      craft_cost: ['fox'],        item: 'crossbow' },
  { id: 'fox_09', suit: 'fox', name: 'Sappers',       craft_cost: ['fox'] },
  { id: 'fox_10', suit: 'fox', name: 'Scout',         craft_cost: ['fox'] },
  { id: 'fox_11', suit: 'fox', name: 'Codebreakers',  craft_cost: ['fox', 'fox'], vp: 1 },
  { id: 'fox_12', suit: 'fox', name: 'Brutal Tactics', craft_cost: ['fox'] },
  { id: 'fox_13', suit: 'fox', name: 'Stand and Deliver', craft_cost: ['fox', 'fox'] },
  { id: 'fox_14', suit: 'fox', name: 'False Orders',  craft_cost: ['fox'] },
]

const RABBIT_CARDS: Card[] = [
  { id: 'rab_01', suit: 'rabbit', name: 'Ambush',          craft_cost: ['rabbit', 'rabbit'] },
  { id: 'rab_02', suit: 'rabbit', name: 'Cobbler',         craft_cost: ['rabbit'], item: 'boots' },
  { id: 'rab_03', suit: 'rabbit', name: 'Rabbits Everywhere', craft_cost: ['rabbit'] },
  { id: 'rab_04', suit: 'rabbit', name: 'Armorers',        craft_cost: ['rabbit', 'rabbit'], vp: 2 },
  { id: 'rab_05', suit: 'rabbit', name: 'Better Burrow Bank', craft_cost: ['rabbit', 'rabbit'] },
  { id: 'rab_06', suit: 'rabbit', name: 'Swap Meet',       craft_cost: ['rabbit'] },
  { id: 'rab_07', suit: 'rabbit', name: 'Charm Offensive', craft_cost: ['rabbit', 'rabbit'] },
  { id: 'rab_08', suit: 'rabbit', name: 'Investments',     craft_cost: ['rabbit', 'rabbit'], vp: 1 },
  { id: 'rab_09', suit: 'rabbit', name: 'A Visit to Friends', craft_cost: ['rabbit'] },
  { id: 'rab_10', suit: 'rabbit', name: 'Informants',      craft_cost: ['rabbit'] },
  { id: 'rab_11', suit: 'rabbit', name: 'Propaganda Bureau', craft_cost: ['rabbit', 'rabbit'] },
  { id: 'rab_12', suit: 'rabbit', name: 'Soup Kitchens',   craft_cost: ['rabbit'] },
  { id: 'rab_13', suit: 'rabbit', name: 'Favour of the Rabbits', craft_cost: ['rabbit', 'rabbit', 'rabbit'] },
  { id: 'rab_14', suit: 'rabbit', name: 'Bake Sale',       craft_cost: ['rabbit'] },
]

const MOUSE_CARDS: Card[] = [
  { id: 'mou_01', suit: 'mouse', name: 'Ambush',           craft_cost: ['mouse', 'mouse'] },
  { id: 'mou_02', suit: 'mouse', name: 'Crossbow',         craft_cost: ['mouse'],  item: 'crossbow' },
  { id: 'mou_03', suit: 'mouse', name: 'Mouseguard',       craft_cost: ['mouse'] },
  { id: 'mou_04', suit: 'mouse', name: 'Sappers',          craft_cost: ['mouse', 'mouse'], vp: 2 },
  { id: 'mou_05', suit: 'mouse', name: 'Mouse in a Sack',  craft_cost: ['mouse', 'mouse'] },
  { id: 'mou_06', suit: 'mouse', name: 'Master Engravers', craft_cost: ['mouse', 'mouse'] },
  { id: 'mou_07', suit: 'mouse', name: 'Eyrie Emigres',    craft_cost: ['mouse'] },
  { id: 'mou_08', suit: 'mouse', name: 'Brutal Tactics',   craft_cost: ['mouse'] },
  { id: 'mou_09', suit: 'mouse', name: 'Scouts',           craft_cost: ['mouse'] },
  { id: 'mou_10', suit: 'mouse', name: 'Smugglers',        craft_cost: ['mouse'] },
  { id: 'mou_11', suit: 'mouse', name: 'Royal Claim',      craft_cost: ['mouse', 'mouse', 'mouse', 'mouse'] },
  { id: 'mou_12', suit: 'mouse', name: 'Favour of the Mice', craft_cost: ['mouse', 'mouse', 'mouse'] },
  { id: 'mou_13', suit: 'mouse', name: 'Arms Trader',      craft_cost: ['mouse', 'mouse'],  item: 'sword' },
  { id: 'mou_14', suit: 'mouse', name: 'Woodland Runners', craft_cost: ['mouse'] },
]

const BIRD_CARDS: Card[] = [
  { id: 'bir_01', suit: 'bird', name: 'Ambush',         craft_cost: ['bird', 'bird'] },
  { id: 'bir_02', suit: 'bird', name: 'Hammer',         craft_cost: ['bird'],        item: 'hammer' },
  { id: 'bir_03', suit: 'bird', name: 'Bird Vizier',    craft_cost: [] },
  { id: 'bir_04', suit: 'bird', name: 'Bird Vizier 2',  craft_cost: [] },
  { id: 'bir_05', suit: 'bird', name: 'Bird Vizier 3',  craft_cost: [] },
  { id: 'bir_06', suit: 'bird', name: 'Bird Vizier 4',  craft_cost: [] },
  { id: 'bir_07', suit: 'bird', name: 'Bird Vizier 5',  craft_cost: [] },
  { id: 'bir_08', suit: 'bird', name: 'Corvid Planners', craft_cost: ['bird', 'bird'] },
  { id: 'bir_09', suit: 'bird', name: 'Mounted Band',   craft_cost: ['bird', 'bird'] },
  { id: 'bir_10', suit: 'bird', name: 'Royal Omen',     craft_cost: ['bird'] },
  { id: 'bir_11', suit: 'bird', name: 'Trick Shot',     craft_cost: ['bird'] },
  { id: 'bir_12', suit: 'bird', name: 'Murine Broker',  craft_cost: ['bird', 'bird'] },
]

export const ALL_CARDS: Card[] = [
  ...FOX_CARDS,
  ...RABBIT_CARDS,
  ...MOUSE_CARDS,
  ...BIRD_CARDS,
]

export const CARDS_BY_ID: Record<string, Card> = Object.fromEntries(
  ALL_CARDS.map(c => [c.id, c])
)

// ============================================================
// Deck operations
// ============================================================

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function createShuffledDeck(): string[] {
  return shuffle(ALL_CARDS.map(c => c.id))
}

export function dealCards(
  deck: string[],
  count: number
): { hand: string[]; remainingDeck: string[] } {
  const hand = deck.slice(0, count)
  const remainingDeck = deck.slice(count)
  return { hand, remainingDeck }
}

/**
 * Draw a single card from the top of the deck.
 * Returns { card: null, deck } if deck is empty.
 */
export function drawCard(deck: string[]): { card: string | null; deck: string[] } {
  if (deck.length === 0) return { card: null, deck }
  return { card: deck[0], deck: deck.slice(1) }
}

/**
 * Check if a player's hand can pay the craft cost of a card.
 */
export function canCraft(hand: string[], craftCost: Suit[]): boolean {
  if (craftCost.length === 0) return false
  const available: Partial<Record<Suit, number>> = {}
  for (const cardId of hand) {
    const card = CARDS_BY_ID[cardId]
    if (card) available[card.suit] = (available[card.suit] ?? 0) + 1
  }
  const needed: Partial<Record<Suit, number>> = {}
  for (const suit of craftCost) {
    if (suit === 'bird') continue // bird is wild — skip for simplicity
    needed[suit] = (needed[suit] ?? 0) + 1
  }
  for (const [suit, count] of Object.entries(needed) as [Suit, number][]) {
    if ((available[suit] ?? 0) < count) return false
  }
  return true
}

/**
 * Returns the cards that match a given suit from a hand.
 */
export function getCardsOfSuit(hand: string[], suit: Suit): string[] {
  return hand.filter(id => CARDS_BY_ID[id]?.suit === suit || CARDS_BY_ID[id]?.suit === 'bird')
}
