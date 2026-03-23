'use client'

import React from 'react'
import type { Faction, GameState } from '@/lib/types'

const FACTION_NAMES: Record<Faction, string> = {
  marquise: 'Marquise de Cat',
  eyrie:    'Eyrie Dynasties',
  alliance: 'Woodland Alliance',
  vagabond: 'Vagabond',
}

const FACTION_EMOJI: Record<Faction, string> = {
  marquise: '🐱',
  eyrie:    '🦅',
  alliance: '🌿',
  vagabond: '🦡',
}

interface VictoryScreenProps {
  state: GameState
  winnerId: string
  myUserId: string
  onPlayAgain: () => void
}

export default function VictoryScreen({ state, winnerId, myUserId, onPlayAgain }: VictoryScreenProps) {
  const winner = state.players[winnerId]
  const isMe = winnerId === myUserId
  const faction = winner?.faction

  // Sort players by VP for final scores
  const sortedPlayers = Object.entries(state.players).sort(
    ([, a], [, b]) => b.vp - a.vp
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ border: '2px solid #D4A848', background: 'linear-gradient(135deg, #1a1a0a 0%, #1a2f1e 100%)' }}>

        {/* Header */}
        <div className="text-center px-8 pt-8 pb-4"
          style={{ background: 'linear-gradient(to bottom, rgba(212,168,72,0.15), transparent)' }}>
          <div className="text-6xl mb-4">
            {isMe ? '🏆' : faction ? FACTION_EMOJI[faction] : '🎮'}
          </div>
          <h1 className="font-serif text-3xl font-bold mb-2" style={{ color: '#D4A848' }}>
            {isMe ? 'Victory!' : 'Game Over'}
          </h1>
          <p className="text-gray-300 text-lg">
            {faction && (
              <>
                <span style={{ color: '#D4A848' }}>{FACTION_NAMES[faction]}</span>
                {' wins the woodland!'}
              </>
            )}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {winner?.vp ?? 0} Victory Points after {state.turn_number} turns
          </p>
        </div>

        {/* Score table */}
        <div className="px-8 pb-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-mono">
            Final Scores
          </div>
          <div className="space-y-2">
            {sortedPlayers.map(([uid, player], i) => {
              const isWinner = uid === winnerId
              const isYou = uid === myUserId
              return (
                <div
                  key={uid}
                  className="flex items-center gap-3 rounded-lg px-3 py-2"
                  style={{
                    background: isWinner ? 'rgba(212,168,72,0.1)' : 'rgba(255,255,255,0.03)',
                    border: isWinner ? '1px solid rgba(212,168,72,0.4)' : '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <span className="text-gray-500 font-mono text-sm w-5">#{i + 1}</span>
                  <span className="text-xl">{player.faction ? FACTION_EMOJI[player.faction] : '❓'}</span>
                  <div className="flex-1">
                    <div className="text-sm text-white">
                      {player.faction ? FACTION_NAMES[player.faction] : 'Unknown'}
                      {isYou && <span className="text-gray-500 ml-1">(you)</span>}
                    </div>
                  </div>
                  <div className="font-bold text-lg" style={{ color: isWinner ? '#D4A848' : '#888' }}>
                    {player.vp}
                    <span className="text-xs font-normal ml-1" style={{ color: '#666' }}>VP</span>
                  </div>
                  {isWinner && <span style={{ color: '#D4A848' }}>👑</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 pt-2 flex gap-3">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 rounded-lg font-serif font-semibold text-black transition-all hover:brightness-110 active:scale-95"
            style={{ background: '#D4A848' }}
          >
            Play Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 py-3 rounded-lg font-serif font-semibold transition-all hover:bg-gray-700 active:scale-95"
            style={{ background: '#1a1a1a', color: '#888', border: '1px solid #333' }}
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  )
}
