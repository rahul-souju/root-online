'use client'

import React, { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGameState } from '@/hooks/useGameState'
import { useGameActions } from '@/hooks/useGameActions'
import GameBoard from '@/components/board/GameBoard'
import ActionPanel from '@/components/board/ActionPanel'
import ScoreTrack from '@/components/ui/ScoreTrack'
import HandCards from '@/components/ui/HandCards'
import VictoryScreen from '@/components/ui/VictoryScreen'
import { getMovableClearings, getMoveTargets } from '@/lib/game/map'
import type { Faction } from '@/lib/types'

const FACTION_NAMES: Record<Faction, string> = {
  marquise: 'Marquise de Cat',
  eyrie:    'Eyrie Dynasties',
  alliance: 'Woodland Alliance',
  vagabond: 'Vagabond',
}

const FACTION_COLORS: Record<Faction, string> = {
  marquise: '#B5451B',
  eyrie:    '#4A90D9',
  alliance: '#2D6A4F',
  vagabond: '#8B6914',
}

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string

  const { state, seq, status, hostId, userId, isLoading, error, refetch } = useGameState(roomId)
  const { dispatch, isPending, lastError } = useGameActions(roomId, seq, refetch)

  const [selectedClearing, setSelectedClearing] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  // Compute highlighted clearings based on context
  const highlightedClearings: string[] = React.useMemo(() => {
    if (!state || !userId) return []
    const player = state.players[userId]
    if (!player || state.current_player !== userId) return []

    if (pendingAction === 'MOVE' && selectedClearing) {
      return getMoveTargets(selectedClearing, player.faction, state)
    }
    if (pendingAction === 'MOVE') {
      return getMovableClearings(player.faction, state)
    }
    return []
  }, [state, userId, pendingAction, selectedClearing])

  const handleClearingClick = useCallback((clearingId: string) => {
    setSelectedClearing(prev => prev === clearingId ? null : clearingId)
  }, [])

  const handleAction = useCallback(async (type: string, payload?: Record<string, unknown>) => {
    if (!userId || !state) return

    // Handle two-step MOVE: first select source, then target
    if (type === 'MOVE') {
      if (!pendingAction) {
        setPendingAction('MOVE')
        return
      }
      if (pendingAction === 'MOVE' && selectedClearing) {
        // Need fromId — use any clearing with our warriors as source
        // This is simplified — in a full implementation, user picks source first
        const player = state.players[userId]
        const movables = getMovableClearings(player.faction, state)
        if (movables.length === 0) return

        const fromId = movables[0] // simplified: use first movable clearing
        await dispatch({
          type: 'MOVE',
          payload: { fromId, toId: selectedClearing, count: payload?.count ?? 1 },
        })
        setPendingAction(null)
        setSelectedClearing(null)
        return
      }
    }

    setPendingAction(null)
    await dispatch({ type, payload })
  }, [userId, state, pendingAction, selectedClearing, dispatch])

  // Loading states
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 font-serif text-lg animate-pulse">Loading game...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 rounded bg-gray-800 text-gray-300 hover:bg-gray-700"
        >
          Back to Home
        </button>
      </div>
    )
  }

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Waiting for game to start...</p>
      </div>
    )
  }

  const myPlayer = userId ? state.players[userId] : null
  const myFaction = myPlayer?.faction
  const isMyTurn = state.current_player === userId

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f1a10' }}>

      {/* Victory screen overlay */}
      {status === 'finished' && state.winner && userId && (
        <VictoryScreen
          state={state}
          winnerId={state.winner}
          myUserId={userId}
          onPlayAgain={() => router.push('/')}
        />
      )}

      {/* Top bar */}
      <header className="px-4 py-2 border-b flex items-center justify-between flex-wrap gap-2"
        style={{ borderColor: '#2D6A4F', background: 'rgba(0,0,0,0.5)' }}>
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-xl font-bold" style={{ color: '#D4A848' }}>
            Root Online
          </h1>
          <span className="text-gray-600">|</span>
          {myFaction && (
            <span
              className="text-sm font-semibold px-2 py-0.5 rounded"
              style={{
                color: FACTION_COLORS[myFaction],
                background: `${FACTION_COLORS[myFaction]}20`,
              }}
            >
              {FACTION_NAMES[myFaction]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">Turn {state.turn_number}</span>
          <span
            className="px-2 py-0.5 rounded text-xs font-mono uppercase"
            style={{
              background: isMyTurn ? '#2D6A4F30' : '#88888820',
              color: isMyTurn ? '#4ade80' : '#888',
            }}
          >
            {isMyTurn ? 'Your Turn' : `${state.players[state.current_player]?.faction ?? '?'}'s turn`}
          </span>
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-400 text-xs"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Main layout: left sidebar | board | right sidebar */}
      <div className="flex-1 grid grid-cols-[220px_1fr_240px] gap-0 overflow-hidden">

        {/* Left sidebar: Score track */}
        <aside className="border-r px-4 py-4 overflow-y-auto"
          style={{ borderColor: '#1e3020', background: '#0d170e' }}>
          <ScoreTrack state={state} userId={userId ?? ''} />
        </aside>

        {/* Center: Game board */}
        <main className="flex items-center justify-center p-4 overflow-hidden">
          <div className="w-full h-full max-w-3xl">
            <GameBoard
              state={state}
              userId={userId ?? ''}
              selectedClearing={selectedClearing}
              highlightedClearings={highlightedClearings}
              onClearingClick={handleClearingClick}
            />
            {pendingAction && (
              <div className="mt-2 text-center text-sm text-yellow-400 animate-pulse">
                {pendingAction === 'MOVE' && !selectedClearing
                  ? 'Click a clearing to select warriors to move from...'
                  : pendingAction === 'MOVE' && selectedClearing
                    ? 'Click a destination clearing to move warriors there'
                    : `Click a clearing to ${pendingAction.toLowerCase()}`}
              </div>
            )}
          </div>
        </main>

        {/* Right sidebar: Hand + Actions */}
        <aside className="border-l px-4 py-4 flex flex-col gap-4 overflow-y-auto"
          style={{ borderColor: '#1e3020', background: '#0d170e' }}>

          {/* My hand */}
          {myPlayer && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-mono">
                Your Hand ({myPlayer.hand.length} cards)
              </div>
              <HandCards hand={myPlayer.hand} />
            </div>
          )}

          {/* VP quick view */}
          {myPlayer && (
            <div className="text-xs text-gray-500 flex justify-between">
              <span>Your VP</span>
              <span className="font-bold text-white font-mono">{myPlayer.vp} / 30</span>
            </div>
          )}

          <div className="border-t pt-3" style={{ borderColor: '#1e3020' }}>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-mono">
              Actions
            </div>
            <ActionPanel
              state={state}
              userId={userId ?? ''}
              selectedClearing={selectedClearing}
              onAction={handleAction}
              isPending={isPending}
              lastError={lastError}
            />
          </div>

          {/* Other players' hands (hidden count) */}
          <div className="border-t pt-3 space-y-2" style={{ borderColor: '#1e3020' }}>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-mono">
              Opponents
            </div>
            {Object.entries(state.players)
              .filter(([uid]) => uid !== userId)
              .map(([uid, player]) => (
                <div key={uid} className="text-xs flex items-center justify-between">
                  <span style={{ color: FACTION_COLORS[player.faction] }}>
                    {FACTION_NAMES[player.faction]}
                  </span>
                  <span className="text-gray-500">
                    {player.hand.length} cards · {player.vp} VP
                  </span>
                </div>
              ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
