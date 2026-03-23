import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { applyAction, filterStateForPlayer } from '@/lib/game/actions'
import { checkVictory } from '@/lib/game/engine'
import type { Action } from '@/lib/types'

// POST /api/game/[roomId]/action — Process a player action
export async function POST(
  req: Request,
  { params }: { params: { roomId: string } }
) {
  const supabase = createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { roomId } = params
  const action = await req.json() as Action

  // Load current state
  const { data: room, error: roomError } = await supabase
    .from('game_rooms')
    .select('state, seq, status')
    .eq('id', roomId)
    .single()

  if (roomError || !room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  if (room.status !== 'playing') {
    return NextResponse.json({ error: 'Game is not in progress' }, { status: 409 })
  }

  // Optimistic concurrency — reject stale actions
  if (action.seq !== room.seq) {
    return NextResponse.json(
      { error: 'State out of sync — please refresh', code: 'STALE' },
      { status: 409 }
    )
  }

  // Validate + apply action (pure function)
  const result = applyAction(room.state, action, user.id)

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  // Check for victory
  const winner = checkVictory(result.newState)
  const newStatus = winner ? 'finished' : 'playing'
  if (winner) {
    result.newState.winner = winner
  }

  // Persist — triggers Supabase Realtime broadcast to all players
  const { error: updateError } = await supabase
    .from('game_rooms')
    .update({
      state: result.newState,
      phase: result.newState.phase,
      seq: room.seq + 1,
      status: newStatus,
    })
    .eq('id', roomId)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to save game state' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, seq: room.seq + 1 })
}
