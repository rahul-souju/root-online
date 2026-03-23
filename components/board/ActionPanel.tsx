'use client'

import React, { useState } from 'react'
import type { AvailableAction, GameState, Faction } from '@/lib/types'
import { getAvailableActionsForFaction } from '@/lib/game/engine'

const FACTION_COLORS: Record<Faction, string> = {
  marquise: '#B5451B',
  eyrie:    '#4A90D9',
  alliance: '#2D6A4F',
  vagabond: '#6B5B45',
}

interface ActionPanelProps {
  state: GameState
  userId: string
  selectedClearing: string | null
  onAction: (type: string, payload?: Record<string, unknown>) => void
  isPending: boolean
  lastError: string | null
}

export default function ActionPanel({
  state,
  userId,
  selectedClearing,
  onAction,
  isPending,
  lastError,
}: ActionPanelProps) {
  const player = state.players[userId]
  const isMyTurn = state.current_player === userId
  const availableActions = isMyTurn ? getAvailableActionsForFaction(state, userId) : []
  const faction = player?.faction
  const accentColor = faction ? FACTION_COLORS[faction] : '#888'

  // For MOVE action: need to pick warrior count
  const [moveCount, setMoveCount] = useState(1)

  if (!player) return null

  const handleAction = (action: AvailableAction) => {
    if (!isMyTurn || isPending) return

    if (action.requiresTarget && !selectedClearing) {
      // Visual feedback: needs target selection
      return
    }

    let payload: Record<string, unknown> = {}

    switch (action.type) {
      case 'MOVE':
        if (!selectedClearing) return
        payload = { toId: selectedClearing, fromId: selectedClearing, count: moveCount }
        break
      case 'BATTLE':
        if (!selectedClearing) return
        payload = { clearingId: selectedClearing }
        break
      case 'BUILD':
        if (!selectedClearing) return
        payload = { clearingId: selectedClearing, buildingType: 'sawmill' } // simplified — always builds sawmill
        break
      default:
        break
    }

    onAction(action.type, Object.keys(payload).length > 0 ? payload : undefined)
  }

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Turn indicator */}
      <div
        className="rounded-lg px-3 py-2 text-sm font-semibold text-center"
        style={{ backgroundColor: isMyTurn ? accentColor : '#1a1a1a', color: 'white' }}
      >
        {isMyTurn ? 'Your Turn' : 'Waiting...'}
      </div>

      {/* Phase + Actions remaining */}
      <div className="text-xs text-center text-gray-400 font-mono uppercase tracking-wide">
        Phase: {state.phase} &bull; Actions: {state.actions_remaining}
      </div>

      {/* Error */}
      {lastError && (
        <div className="rounded px-2 py-1 text-xs text-red-400 bg-red-950/40 border border-red-800">
          {lastError}
        </div>
      )}

      {/* Selected clearing info */}
      {selectedClearing && (
        <div className="rounded px-2 py-1 text-xs text-yellow-300 bg-yellow-900/20 border border-yellow-700">
          Selected: Clearing #{selectedClearing} ({state.map.clearings[selectedClearing]?.suit})
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-1 overflow-y-auto flex-1">
        {!isMyTurn && (
          <p className="text-gray-500 text-xs text-center pt-4">
            Waiting for {Object.values(state.players).find(p => p.faction && state.current_player)?.faction ?? 'other player'} to move...
          </p>
        )}
        {availableActions.map((action) => {
          const needsTarget = action.requiresTarget && !selectedClearing
          return (
            <button
              key={action.type}
              onClick={() => handleAction(action)}
              disabled={isPending || needsTarget}
              className={`
                w-full text-left px-3 py-2 rounded text-sm font-medium transition-all
                border border-transparent
                ${needsTarget
                  ? 'opacity-50 cursor-default text-gray-500 bg-gray-900'
                  : isPending
                    ? 'opacity-60 cursor-not-allowed bg-gray-800 text-gray-400'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-100 hover:border-gray-600 cursor-pointer active:scale-95'
                }
              `}
            >
              <span className="flex items-center gap-2">
                {action.auto && <span className="text-xs text-yellow-500">[AUTO]</span>}
                {needsTarget && <span className="text-xs text-blue-400">[click map]</span>}
                {action.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Move count selector (visible when MOVE is available) */}
      {isMyTurn && availableActions.some(a => a.type === 'MOVE') && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Warriors to move:</span>
          <input
            type="number"
            min={1}
            max={20}
            value={moveCount}
            onChange={e => setMoveCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-14 bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white text-xs"
          />
        </div>
      )}
    </div>
  )
}
