'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Faction, RoomPlayer } from '@/lib/types'

interface UseLobbyReturn {
  players: RoomPlayer[]
  roomCode: string
  hostId: string | null
  userId: string | null
  status: string
  isLoading: boolean
  chooseFaction: (faction: Faction) => Promise<void>
  startGame: (roomId: string) => Promise<{ ok: boolean; error?: string }>
}

export function useLobby(roomId: string, roomCode: string): UseLobbyReturn {
  const supabase = createClient()
  const [players, setPlayers] = useState<RoomPlayer[]>([])
  const [hostId, setHostId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [status, setStatus] = useState('lobby')
  const [isLoading, setIsLoading] = useState(true)

  const fetchPlayers = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)

    const { data: room } = await supabase
      .from('game_rooms')
      .select('host_id, status')
      .eq('id', roomId)
      .single()

    if (room) {
      setHostId(room.host_id)
      setStatus(room.status)
    }

    const { data: rp } = await supabase
      .from('room_players')
      .select('user_id, faction, seat_order')
      .eq('room_id', roomId)
      .order('seat_order')

    if (rp) setPlayers(rp as RoomPlayer[])
    setIsLoading(false)
  }, [roomId])

  useEffect(() => {
    fetchPlayers()

    // Subscribe to room_players changes
    const channel = supabase
      .channel(`lobby:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
        () => fetchPlayers()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.new?.status) setStatus(payload.new.status)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomId, fetchPlayers])

  const chooseFaction = useCallback(async (faction: Faction) => {
    await fetch(`/api/rooms/${roomCode}/faction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ faction }),
    })
  }, [roomCode])

  const startGame = useCallback(async (rId: string) => {
    const res = await fetch(`/api/game/${rId}/start`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error }
    return { ok: true }
  }, [])

  return { players, roomCode, hostId, userId, status, isLoading, chooseFaction, startGame }
}
