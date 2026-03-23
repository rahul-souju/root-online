'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GameState } from '@/lib/types'

interface UseGameStateReturn {
  state: GameState | null
  seq: number
  status: string
  hostId: string | null
  userId: string | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useGameState(roomId: string): UseGameStateReturn {
  const supabase = createClient()
  const [state, setState] = useState<GameState | null>(null)
  const [seq, setSeq] = useState(0)
  const [status, setStatus] = useState('lobby')
  const [hostId, setHostId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/game/${roomId}/state`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to load game state')
        return
      }
      const data = await res.json()
      setState(data.state)
      setSeq(data.seq)
      setStatus(data.status)
      setHostId(data.hostId)
      setUserId(data.userId)
      setError(null)
    } catch (e) {
      setError('Network error')
    } finally {
      setIsLoading(false)
    }
  }, [roomId])

  useEffect(() => {
    if (!roomId) return

    // Initial load
    fetchState()

    // Subscribe to realtime updates on game_rooms
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${roomId}`,
        },
        async (payload) => {
          // Re-fetch state from server (ensures private filtering)
          await fetchState()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, fetchState])

  return { state, seq, status, hostId, userId, isLoading, error, refetch: fetchState }
}
