import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { Faction } from '@/lib/types'

const VALID_FACTIONS: Faction[] = ['marquise', 'eyrie', 'alliance', 'vagabond']

// POST /api/rooms/[code]/faction — Choose a faction in the lobby
export async function POST(
  req: Request,
  { params }: { params: { code: string } }
) {
  const supabase = createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { faction } = await req.json() as { faction: Faction }

  if (!VALID_FACTIONS.includes(faction)) {
    return NextResponse.json({ error: 'Invalid faction' }, { status: 400 })
  }

  const code = params.code.toUpperCase()

  // Find room
  const { data: room, error: roomError } = await supabase
    .from('game_rooms')
    .select('id, status')
    .eq('code', code)
    .single()

  if (roomError || !room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  if (room.status !== 'lobby') {
    return NextResponse.json({ error: 'Game already started' }, { status: 409 })
  }

  // Check faction not already taken by another player
  const { data: taken } = await supabase
    .from('room_players')
    .select('user_id')
    .eq('room_id', room.id)
    .eq('faction', faction)
    .neq('user_id', user.id)
    .single()

  if (taken) {
    return NextResponse.json({ error: 'Faction already chosen by another player' }, { status: 409 })
  }

  // Update this player's faction
  const { error: updateError } = await supabase
    .from('room_players')
    .update({ faction })
    .eq('room_id', room.id)
    .eq('user_id', user.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to choose faction' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
