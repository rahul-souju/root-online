'use client'

import React from 'react'
import type { Faction, GameState } from '@/lib/types'

const FACTION_COLORS: Record<Faction, string> = {
  marquise: '#B5451B',
  eyrie:    '#4A90D9',
  alliance: '#2D6A4F',
  vagabond: '#8B6914',
}

const FACTION_EMOJI: Record<Faction, string> = {
  marquise: '🐱',
  eyrie:    '🦅',
  alliance: '🌿',
  vagabond: '🦡',
}

interface ScoreTrackProps {
  state: GameState
  userId: string
}

export default function ScoreTrack({ state, userId }: ScoreTrackProps) {
  const sortedPlayers = Object.entries(state.players).sort(([, a], [, b]) => b.vp - a.vp)

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">
        Victory Points
      </div>

      {sortedPlayers.map(([uid, player]) => {
        const isMe = uid === userId
        const faction = player.faction
        const pct = Math.min((player.vp / 30) * 100, 100)

        return (
          <div key={uid} className={`space-y-1 ${isMe ? 'opacity-100' : 'opacity-80'}`}>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-gray-300">
                <span>{FACTION_EMOJI[faction]}</span>
                <span>{isMe ? 'You' : faction}</span>
              </span>
              <span className="font-bold font-mono" style={{ color: FACTION_COLORS[faction] }}>
                {player.vp} / 30
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  backgroundColor: FACTION_COLORS[faction],
                }}
              />
            </div>
          </div>
        )
      })}

      {/* Turn / Phase */}
      <div className="pt-3 border-t border-gray-800 space-y-1">
        <div className="text-xs flex justify-between text-gray-500">
          <span>Turn</span>
          <span className="font-mono text-gray-300">{state.turn_number}</span>
        </div>
        <div className="text-xs flex justify-between text-gray-500">
          <span>Phase</span>
          <span className="font-mono text-gray-300 capitalize">{state.phase}</span>
        </div>
        <div className="text-xs flex justify-between text-gray-500">
          <span>Current</span>
          <span className="font-mono text-gray-300">
            {state.players[state.current_player]?.faction ?? '?'}
          </span>
        </div>
      </div>
    </div>
  )
}
