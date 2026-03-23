'use client'

import React from 'react'
import type { Faction } from '@/lib/types'

const FACTION_INFO: Record<Faction, {
  name: string
  color: string
  bg: string
  emoji: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
}> = {
  marquise: {
    name: 'Marquise de Cat',
    color: '#B5451B',
    bg: 'from-orange-950/60 to-red-950/40',
    emoji: '🐱',
    description: 'Rule the forest through industry. Place sawmills, recruiters, and workshops to dominate the woodland economy. Strong start, straightforward strategy.',
    difficulty: 'Easy',
  },
  eyrie: {
    name: 'Eyrie Dynasties',
    color: '#4A90D9',
    bg: 'from-blue-950/60 to-indigo-950/40',
    emoji: '🦅',
    description: 'Command your birds through an ever-growing Decree. Score VP with roosts, but beware — fail your Decree and face Turmoil!',
    difficulty: 'Medium',
  },
  alliance: {
    name: 'Woodland Alliance',
    color: '#2D6A4F',
    bg: 'from-green-950/60 to-emerald-950/40',
    emoji: '🌿',
    description: 'Start weak, grow strong. Spread sympathy tokens and foment outrage to build a revolutionary movement across the woodland.',
    difficulty: 'Hard',
  },
  vagabond: {
    name: 'Vagabond',
    color: '#8B6914',
    bg: 'from-yellow-950/60 to-amber-950/40',
    emoji: '🦡',
    description: 'A lone wanderer with no warriors. Roam freely, complete quests, aid factions, and play all sides against each other.',
    difficulty: 'Hard',
  },
}

const DIFFICULTY_COLORS = {
  Easy: 'text-green-400',
  Medium: 'text-yellow-400',
  Hard: 'text-red-400',
}

interface FactionPickerProps {
  chosenFactions: Record<string, Faction | null>  // userId -> faction
  myFaction: Faction | null
  myUserId: string
  onChoose: (faction: Faction) => void
}

export default function FactionPicker({ chosenFactions, myFaction, myUserId, onChoose }: FactionPickerProps) {
  const takenByOthers = Object.entries(chosenFactions)
    .filter(([uid, f]) => uid !== myUserId && f !== null)
    .map(([, f]) => f as Faction)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {(Object.entries(FACTION_INFO) as [Faction, typeof FACTION_INFO[Faction]][]).map(([faction, info]) => {
        const isChosen = myFaction === faction
        const isTakenByOther = takenByOthers.includes(faction)
        const isDisabled = isTakenByOther

        return (
          <button
            key={faction}
            onClick={() => !isDisabled && onChoose(faction)}
            disabled={isDisabled}
            className={`
              relative rounded-xl border-2 p-4 text-left transition-all duration-200
              bg-gradient-to-br ${info.bg}
              ${isChosen
                ? 'border-white shadow-lg scale-105'
                : isTakenByOther
                  ? 'border-gray-700 opacity-40 cursor-not-allowed'
                  : 'border-gray-600 hover:border-gray-400 hover:scale-102 cursor-pointer'
              }
            `}
            style={isChosen ? { borderColor: info.color, boxShadow: `0 0 20px ${info.color}40` } : {}}
          >
            {/* Taken badge */}
            {isTakenByOther && (
              <span className="absolute top-2 right-2 text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                Taken
              </span>
            )}

            {/* Chosen badge */}
            {isChosen && (
              <span
                className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ backgroundColor: info.color, color: 'white' }}
              >
                Your Faction
              </span>
            )}

            <div className="text-3xl mb-2">{info.emoji}</div>
            <div className="font-serif font-bold text-white text-lg mb-1">{info.name}</div>
            <div className={`text-xs font-semibold mb-2 ${DIFFICULTY_COLORS[info.difficulty]}`}>
              Difficulty: {info.difficulty}
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{info.description}</p>
          </button>
        )
      })}
    </div>
  )
}
