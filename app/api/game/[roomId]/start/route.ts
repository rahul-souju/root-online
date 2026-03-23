import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { initGameState } from '@/lib/game/setup'
import type { Faction } from '@/lib/types'

// POST /api/game/[roomId]/start — Host starts the game
export async function POST(
  _req: Request,
  { params }: { params: { roomId: string } }
) {
  const supabase = createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { roomId } = params

  // Load room
  const { data: room, error: roomError } = await supabase
    .from('game_rooms')
    .select('id, host_id, status')
    .eq('id', roomId)
    .single()

  if (roomError || !room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  if (room.host_id !== user.id) {
    return NextResponse.json({ error: 'Only the host can start the game' }, { status: 403 })
  }

  if (room.status !== 'lobby') {
    return NextResponse.json({ error: 'Game already started' }, { status: 409 })
  }

  // Load players
  const { data: players, error: playersError } = await supabase
    .from('room_players')
    .select('user_id, faction, seat_order')
    .eq('room_id', roomId)
    .order('seat_order')

  if (playersError || !players) {
    return NextResponse.json({ error: 'Failed to load players' }, { status: 500 })
  }

  if (players.length < 2) {
    return NextResponse.json({ error: 'Need at least 2 players to start' }, { status: 400 })
  }

  // All players must have chosen a faction
  const allChosen = players.every(p => p.faction !== null)
  if (!allChosen) {
    return NextResponse.json({ error: 'All players must choose a faction before starting' }, { status: 400 })
  }

  // Initialize game state
  const initialState = initGameState(
    players.map(p => ({ userId: p.user_id, faction: p.faction as Faction }))
  )

  // Update room
  const { error: updateError } = await supabase
    .from('game_rooms')
    .update({
      status: 'playing',
      phase: 'birdsong',
      state: initialState,
      seq: 1,
    })
    .eq('id', roomId)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to start game' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
