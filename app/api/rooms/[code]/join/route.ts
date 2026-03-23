import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// POST /api/rooms/[code]/join — Join an existing room by 4-letter code
export async function POST(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const supabase = createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const code = params.code.toUpperCase()

  // Find the room
  const { data: room, error: roomError } = await supabase
    .from('game_rooms')
    .select('id, status, host_id')
    .eq('code', code)
    .single()

  if (roomError || !room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  if (room.status !== 'lobby') {
    return NextResponse.json({ error: 'Game already started' }, { status: 409 })
  }

  // Check player count (max 4)
  const { count } = await supabase
    .from('room_players')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', room.id)

  if ((count ?? 0) >= 4) {
    return NextResponse.json({ error: 'Room is full (max 4 players)' }, { status: 409 })
  }

  // Check if already in room
  const { data: existing } = await supabase
    .from('room_players')
    .select('user_id')
    .eq('room_id', room.id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // Already in room — just return roomId
    return NextResponse.json({ roomId: room.id })
  }

  // Insert player
  const { error: insertError } = await supabase.from('room_players').insert({
    room_id: room.id,
    user_id: user.id,
    seat_order: count ?? 1,
  })

  if (insertError) {
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 })
  }

  return NextResponse.json({ roomId: room.id })
}
