'use client'

import React from 'react'
import type { Faction, RoomPlayer } from '@/lib/types'

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

const FACTION_NAMES: Record<Faction, string> = {
  marquise: 'Marquise de Cat',
  eyrie:    'Eyrie Dynasties',
  alliance: 'Woodland Alliance',
  vagabond: 'Vagabond',
}

interface PlayerListProps {
  players: RoomPlayer[]
  hostId: string | null
  myUserId: string | null
}

export default function PlayerList({ players, hostId, myUserId }: PlayerListProps) {
  return (
    <div className="space-y-2">
      {players.map((player, i) => {
        const isHost = player.user_id === hostId
        const isMe = player.user_id === myUserId
        const faction = player.faction as Faction | null

        return (
          <div
            key={player.user_id}
            className={`
              flex items-center gap-3 rounded-lg px-4 py-3
              border transition-all
              ${isMe ? 'border-gray-400 bg-gray-800' : 'border-gray-700 bg-gray-900'}
            `}
          >
            {/* Seat order */}
            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400 font-mono flex-shrink-0">
              {i + 1}
            </div>

            {/* Faction icon / choosing indicator */}
            <div className="text-2xl flex-shrink-0 w-8 text-center">
              {faction ? FACTION_EMOJI[faction] : '❓'}
            </div>

            {/* Player info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white font-medium truncate">
                  {isMe ? 'You' : `Player ${i + 1}`}
                </span>
                {isHost && (
                  <span className="text-xs bg-yellow-900/40 border border-yellow-700 text-yellow-400 px-1.5 py-0.5 rounded">
                    Host
                  </span>
                )}
              </div>
              <div className="text-xs mt-0.5" style={{ color: faction ? FACTION_COLORS[faction] : '#6b7280' }}>
                {faction ? FACTION_NAMES[faction] : 'Choosing faction...'}
              </div>
            </div>

            {/* Status dot */}
            <div
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${faction ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}
            />
          </div>
        )
      })}

      {/* Empty slots */}
      {Array.from({ length: Math.max(0, 4 - players.length) }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="flex items-center gap-3 rounded-lg px-4 py-3 border border-dashed border-gray-700 bg-gray-900/30"
        >
          <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-600 font-mono">
            {players.length + i + 1}
          </div>
          <div className="text-2xl w-8 text-center opacity-20">👤</div>
          <span className="text-sm text-gray-600 italic">Waiting for player...</span>
        </div>
      ))}
    </div>
  )
}
