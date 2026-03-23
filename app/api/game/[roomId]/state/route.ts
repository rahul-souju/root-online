import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { filterStateForPlayer } from '@/lib/game/setup'

// GET /api/game/[roomId]/state — Load full state filtered for the requesting player
export async function GET(
  _req: Request,
  { params }: { params: { roomId: string } }
) {
  const supabase = createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { roomId } = params

  const { data: room, error } = await supabase
    .from('game_rooms')
    .select('state, seq, status, phase, code, host_id')
    .eq('id', roomId)
    .single()

  if (error || !room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  const filteredState = room.state && Object.keys(room.state).length > 0
    ? filterStateForPlayer(room.state, user.id)
    : null

  return NextResponse.json({
    state: filteredState,
    seq: room.seq,
    status: room.status,
    phase: room.phase,
    code: room.code,
    hostId: room.host_id,
    userId: user.id,
  })
}
