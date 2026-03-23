import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Generate a random 4-letter uppercase room code
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // Omit I and O (confusing)
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// POST /api/rooms — Create a new game room
export async function POST() {
  const supabase = createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Try to generate a unique code (retry up to 5 times)
  let code = ''
  let roomId = ''

  for (let attempt = 0; attempt < 5; attempt++) {
    code = generateCode()

    const { data: room, error } = await supabase
      .from('game_rooms')
      .insert({
        code,
        host_id: user.id,
        status: 'lobby',
        phase: 'setup',
        state: {},
        seq: 0,
      })
      .select('id')
      .single()

    if (!error && room) {
      roomId = room.id
      break
    }

    // Code collision — retry with a new code
    if (error?.code === '23505') continue

    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }

  if (!roomId) {
    return NextResponse.json({ error: 'Could not generate unique room code' }, { status: 500 })
  }

  // Add host to room_players
  const { error: playerError } = await supabase.from('room_players').insert({
    room_id: roomId,
    user_id: user.id,
    seat_order: 0,
  })

  if (playerError) {
    return NextResponse.json({ error: 'Failed to join room as host' }, { status: 500 })
  }

  return NextResponse.json({ roomId, code })
}
