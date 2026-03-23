// ============================================================
// Core Enums / Unions
// ============================================================

export type Faction = 'marquise' | 'eyrie' | 'alliance' | 'vagabond'
export type Suit = 'fox' | 'rabbit' | 'mouse' | 'bird'
export type BuildingType = 'sawmill' | 'recruiter' | 'workshop' | 'roost' | 'base' | 'castle'
export type TokenType = 'wood' | 'sympathy' | 'keep'
export type GameStatus = 'lobby' | 'playing' | 'finished'
export type GamePhase = 'setup' | 'birdsong' | 'daylight' | 'evening'

// ============================================================
// Map
// ============================================================

export interface BuildingSlot {
  faction: Faction
  type: BuildingType
}

export interface Token {
  faction: Faction
  type: TokenType
}

export interface Clearing {
  suit: Suit
  slots: number                             // max building slots
  adj: string[]                             // adjacent clearing IDs
  warriors: Partial<Record<Faction, number>>
  buildings: Array<BuildingSlot | null>     // null = empty slot
  tokens: Token[]
}

// ============================================================
// Cards
// ============================================================

export interface Card {
  id: string
  suit: Suit
  name: string
  craft_cost?: Suit[]   // suits needed to craft
  item?: string         // item granted on craft
  vp?: number           // VP if craftable for VP
}

// ============================================================
// Player State (faction-specific fields are optional)
// ============================================================

export interface MarquiseState {
  sawmills_available: number
  recruiters_available: number
  workshops_available: number
  wood_tokens: number      // unplaced wood tokens in supply
}

export interface EyrieDecree {
  fox: string[]
  rabbit: string[]
  mouse: string[]
  bird: string[]
}

export interface EyrieState {
  roosts_available: number
  decree: EyrieDecree
  turmoil_count: number
  leader: 'builder' | 'charismatic' | 'commander' | 'despot' | null
  viziers: string[]    // card IDs of loyal viziers
}

export interface AllianceState {
  supporters: string[]                      // card IDs
  bases_available: Partial<Record<Suit, number>>
  sympathy_tokens: number
  officers: number
}

export type VagabondItem = {
  type: string
  exhausted: boolean
  damaged: boolean
}

export interface VagabondState {
  character: 'thief' | 'tinker' | 'ranger'
  items: VagabondItem[]
  relations: Partial<Record<Faction, 'allied' | 'hostile' | 'neutral'>>
  quests_completed: number
}

export interface PlayerState {
  faction: Faction
  vp: number
  hand: string[]                            // card IDs (private — filtered per player)
  warriors_available: number
  // Faction-specific blobs (only one will be populated)
  marquise?: MarquiseState
  eyrie?: EyrieState
  alliance?: AllianceState
  vagabond?: VagabondState
}

// ============================================================
// Game State (stored as JSONB in game_rooms.state)
// ============================================================

export interface GameState {
  map: {
    clearings: Record<string, Clearing>
    forests: Record<string, unknown>
  }
  players: Record<string, PlayerState>      // keyed by userId
  player_order: string[]                    // userId[] in turn order
  deck: string[]                            // server-side only — filtered out before broadcast
  discard: string[]
  current_player: string                    // userId
  phase: GamePhase
  actions_remaining: number
  turn_number: number
  item_supply?: Record<string, number>      // vagabond item supply
  winner?: string                           // userId of winner, set when vp >= 30
}

// ============================================================
// Actions
// ============================================================

export interface Action {
  type: ActionType
  payload?: Record<string, unknown>
  seq: number
}

export type ActionType =
  | 'MOVE'
  | 'BATTLE'
  | 'BUILD'
  | 'RECRUIT'
  | 'CRAFT'
  | 'END_TURN'
  | 'PLACE_WOOD'
  | 'CHOOSE_FACTION'
  // Eyrie
  | 'EYRIE_ADD_TO_DECREE'
  | 'EYRIE_RESOLVE_DECREE'
  // Alliance
  | 'ALLIANCE_SYMPATHY'
  | 'ALLIANCE_MOBILIZE'
  | 'ALLIANCE_TRAIN'
  // Vagabond
  | 'VAGABOND_MOVE'
  | 'VAGABOND_EXPLORE'
  | 'VAGABOND_AID'
  | 'VAGABOND_QUEST'
  | 'VAGABOND_STRIKE'
  | 'VAGABOND_REPAIR'

export interface AvailableAction {
  type: ActionType | string
  label: string
  auto?: boolean            // if true, triggered automatically (no player input needed)
  requiresTarget?: boolean  // if true, player must click a clearing
  payload?: Record<string, unknown>
}

export type ActionResult =
  | { ok: true; newState: GameState }
  | { ok: false; error: string }

// ============================================================
// API Response Types
// ============================================================

export interface RoomPlayer {
  user_id: string
  faction: Faction | null
  seat_order: number
  email?: string
}

export interface RoomInfo {
  id: string
  code: string
  host_id: string
  status: GameStatus
  phase: GamePhase
  seq: number
  players: RoomPlayer[]
}
