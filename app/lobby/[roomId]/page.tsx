'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useLobby } from '@/hooks/useLobby'
import FactionPicker from '@/components/lobby/FactionPicker'
import PlayerList from '@/components/lobby/PlayerList'
import type { Faction } from '@/lib/types'

export default function LobbyPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()

  const roomId = params.roomId as string
  const roomCode = searchParams.get('code') ?? ''

  const { players, hostId, userId, status, isLoading, chooseFaction, startGame } =
    useLobby(roomId, roomCode)

  const [startError, setStartError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  // Redirect to game once started
  useEffect(() => {
    if (status === 'playing') {
      router.push(`/game/${roomId}`)
    }
  }, [status, roomId, router])

  const myPlayer = players.find(p => p.user_id === userId)
  const myFaction = myPlayer?.faction as Faction | null
  const isHost = userId === hostId
  const allChosen = players.length >= 2 && players.every(p => p.faction !== null)

  const chosenFactions = Object.fromEntries(
    players.map(p => [p.user_id, p.faction as Faction | null])
  )

  const handleStartGame = async () => {
    setIsStarting(true)
    setStartError(null)
    const result = await startGame(roomId)
    if (!result.ok) {
      setStartError(result.error ?? 'Failed to start game')
    }
    setIsStarting(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 font-serif text-lg animate-pulse">
          Loading lobby...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen"
      style={{ background: 'radial-gradient(ellipse at top, #1a2f1e 0%, #0f1a10 70%)' }}>

      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between"
        style={{ borderColor: '#2D6A4F', background: 'rgba(0,0,0,0.3)' }}>
        <div>
          <h1 className="font-serif text-2xl font-bold" style={{ color: '#D4A848' }}>
            Root Online
          </h1>
          <p className="text-gray-500 text-sm">Woodland Lobby</p>
        </div>

        {/* Room code */}
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Room Code</div>
          <div
            className="font-mono text-3xl font-bold tracking-widest px-4 py-1 rounded-lg"
            style={{ color: '#D4A848', background: 'rgba(212,168,72,0.1)', border: '1px solid rgba(212,168,72,0.3)' }}
          >
            {roomCode || '????'}
          </div>
          <div className="text-xs text-gray-600 mt-1">Share with friends</div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Players + controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Players */}
          <div className="rounded-xl p-4 space-y-3"
            style={{ background: '#111d13', border: '1px solid #2D6A4F' }}>
            <h2 className="font-serif text-lg" style={{ color: '#D4A848' }}>
              Players ({players.length}/4)
            </h2>
            <PlayerList players={players} hostId={hostId} myUserId={userId} />
          </div>

          {/* Start game (host only) */}
          {isHost && (
            <div className="rounded-xl p-4 space-y-3"
              style={{ background: '#111d13', border: '1px solid #2D6A4F' }}>
              <h2 className="font-serif text-lg text-gray-200">Ready to Play?</h2>

              {!allChosen && (
                <p className="text-xs text-yellow-600">
                  Waiting for all players to choose a faction...
                </p>
              )}
              {players.length < 2 && (
                <p className="text-xs text-yellow-600">
                  Need at least 2 players to start.
                </p>
              )}

              {startError && (
                <p className="text-xs text-red-400">{startError}</p>
              )}

              <button
                onClick={handleStartGame}
                disabled={!allChosen || isStarting || players.length < 2}
                className="w-full py-3 rounded-lg font-serif font-semibold text-black transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                style={{ background: '#D4A848' }}
              >
                {isStarting ? 'Starting...' : 'Start Game!'}
              </button>
            </div>
          )}

          {!isHost && (
            <div className="rounded-xl p-4 text-center text-gray-500 text-sm"
              style={{ background: '#111d13', border: '1px solid #2a3d2e' }}>
              Waiting for the host to start the game...
            </div>
          )}
        </div>

        {/* Right: Faction picker */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-serif text-xl" style={{ color: '#D4A848' }}>
            Choose Your Faction
          </h2>
          <p className="text-gray-400 text-sm">
            Each faction plays differently. Select one below to claim it.
          </p>

          <FactionPicker
            chosenFactions={chosenFactions}
            myFaction={myFaction}
            myUserId={userId ?? ''}
            onChoose={chooseFaction}
          />
        </div>
      </div>
    </div>
  )
}
