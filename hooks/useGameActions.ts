'use client'

import { useState, useCallback } from 'react'
import type { ActionType } from '@/lib/types'

interface DispatchOptions {
  type: ActionType | string
  payload?: Record<string, unknown>
}

interface UseGameActionsReturn {
  dispatch: (action: DispatchOptions) => Promise<void>
  isPending: boolean
  lastError: string | null
}

export function useGameActions(
  roomId: string,
  seq: number,
  onSeqMismatch: () => Promise<void>
): UseGameActionsReturn {
  const [isPending, setIsPending] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  const dispatch = useCallback(
    async ({ type, payload }: DispatchOptions) => {
      if (isPending) return
      setIsPending(true)
      setLastError(null)

      try {
        const res = await fetch(`/api/game/${roomId}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, payload, seq }),
        })

        const data = await res.json()

        if (!res.ok) {
          if (res.status === 409 && data.code === 'STALE') {
            // State is stale — refetch
            await onSeqMismatch()
            setLastError('State out of sync — refreshing...')
          } else {
            setLastError(data.error ?? 'Action failed')
          }
        }
      } catch {
        setLastError('Network error — please try again')
      } finally {
        setIsPending(false)
      }
    },
    [roomId, seq, isPending, onSeqMismatch]
  )

  return { dispatch, isPending, lastError }
}
