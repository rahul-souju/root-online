'use client'

import React from 'react'
import { CARDS_BY_ID } from '@/lib/game/cards'
import type { Suit } from '@/lib/types'

const SUIT_COLORS: Record<Suit, { bg: string; border: string; text: string }> = {
  fox:    { bg: '#3d1f00', border: '#E8832A', text: '#E8832A' },
  rabbit: { bg: '#001a3d', border: '#6B9ED2', text: '#6B9ED2' },
  mouse:  { bg: '#3d2a00', border: '#D4A848', text: '#D4A848' },
  bird:   { bg: '#1a003d', border: '#9B6BB5', text: '#9B6BB5' },
}

const SUIT_EMOJI: Record<Suit, string> = {
  fox: '🦊', rabbit: '🐰', mouse: '🐭', bird: '🐦'
}

interface HandCardsProps {
  hand: string[]  // card IDs (may include 'hidden' for other players' cards)
}

export default function HandCards({ hand }: HandCardsProps) {
  if (hand.length === 0) {
    return (
      <div className="text-xs text-gray-600 italic text-center py-4">
        No cards in hand
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {hand.map((cardId, i) => {
        if (cardId === 'hidden') {
          return (
            <div
              key={i}
              className="rounded px-2 py-1 text-xs border border-gray-700 bg-gray-900 text-gray-600"
            >
              🂠
            </div>
          )
        }

        const card = CARDS_BY_ID[cardId]
        if (!card) return null

        const colors = SUIT_COLORS[card.suit]

        return (
          <div
            key={cardId}
            title={`${card.name} — ${card.suit}`}
            className="rounded px-2 py-1 text-xs border cursor-default transition-transform hover:scale-110"
            style={{
              backgroundColor: colors.bg,
              borderColor: colors.border,
              color: colors.text,
            }}
          >
            <span className="mr-1">{SUIT_EMOJI[card.suit]}</span>
            <span className="font-medium">{card.name}</span>
            {card.vp && <span className="ml-1 text-yellow-500">+{card.vp}VP</span>}
          </div>
        )
      })}
    </div>
  )
}
