'use client'

import React from 'react'
import { CLEARINGS_DEF, CLEARING_POSITIONS } from '@/lib/game/map'
import type { GameState, Faction } from '@/lib/types'

// Faction color scheme
const FACTION_COLORS: Record<Faction, string> = {
  marquise: '#B5451B',
  eyrie:    '#4A90D9',
  alliance: '#2D6A4F',
  vagabond: '#6B5B45',
}

const SUIT_COLORS: Record<string, string> = {
  fox:    '#E8832A',
  rabbit: '#6B9ED2',
  mouse:  '#D4A848',
  bird:   '#9B6BB5',
}

interface GameBoardProps {
  state: GameState
  userId: string
  selectedClearing: string | null
  highlightedClearings: string[]
  onClearingClick: (clearingId: string) => void
}

export default function GameBoard({
  state,
  userId,
  selectedClearing,
  highlightedClearings,
  onClearingClick,
}: GameBoardProps) {
  const clearings = state.map.clearings

  return (
    <svg
      viewBox="0 0 800 560"
      className="w-full h-full"
      style={{ maxHeight: '560px' }}
    >
      {/* Background */}
      <rect width="800" height="560" fill="#1a2f1e" rx="12" />

      {/* Forest texture */}
      <defs>
        <pattern id="forest" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="2" fill="#243d29" opacity="0.5" />
        </pattern>
      </defs>
      <rect width="800" height="560" fill="url(#forest)" />

      {/* Draw paths between adjacent clearings */}
      {Object.entries(CLEARINGS_DEF).map(([id, def]) =>
        def.adj.map(adjId => {
          // Only draw each path once (lower ID to higher ID)
          if (id >= adjId) return null
          const from = CLEARING_POSITIONS[id]
          const to = CLEARING_POSITIONS[adjId]
          if (!from || !to) return null
          return (
            <line
              key={`${id}-${adjId}`}
              x1={from.x} y1={from.y}
              x2={to.x}   y2={to.y}
              stroke="#4a7a55"
              strokeWidth="3"
              strokeDasharray="6 4"
              opacity="0.7"
            />
          )
        })
      )}

      {/* Draw clearings */}
      {Object.entries(clearings).map(([id, clearing]) => {
        const pos = CLEARING_POSITIONS[id]
        if (!pos) return null

        const isSelected = selectedClearing === id
        const isHighlighted = highlightedClearings.includes(id)
        const suitColor = SUIT_COLORS[clearing.suit] ?? '#888'

        // Count warriors per faction
        const factionWarriors = Object.entries(clearing.warriors).filter(([, count]) => (count ?? 0) > 0)
        const buildings = clearing.buildings.filter(Boolean)
        const tokens = clearing.tokens

        const radius = 32

        return (
          <g
            key={id}
            transform={`translate(${pos.x}, ${pos.y})`}
            onClick={() => onClearingClick(id)}
            style={{ cursor: 'pointer' }}
          >
            {/* Glow effect for highlighted */}
            {isHighlighted && (
              <circle r={radius + 8} fill={suitColor} opacity="0.3" />
            )}
            {isSelected && (
              <circle r={radius + 10} fill="white" opacity="0.4" />
            )}

            {/* Main clearing circle */}
            <circle
              r={radius}
              fill={isSelected ? '#fff' : '#2a3d2e'}
              stroke={isSelected ? suitColor : isHighlighted ? '#ffffff' : suitColor}
              strokeWidth={isSelected ? 4 : isHighlighted ? 3 : 2}
            />

            {/* Suit color ring */}
            <circle r={radius - 4} fill="none" stroke={suitColor} strokeWidth="2" opacity="0.6" />

            {/* Clearing number */}
            <text
              textAnchor="middle"
              y={-radius + 14}
              fontSize="10"
              fill="#aaa"
              fontFamily="Georgia, serif"
            >
              #{id}
            </text>

            {/* Suit label */}
            <text
              textAnchor="middle"
              y="4"
              fontSize="11"
              fill={suitColor}
              fontFamily="Georgia, serif"
              fontWeight="bold"
            >
              {clearing.suit.charAt(0).toUpperCase() + clearing.suit.slice(1)}
            </text>

            {/* Warriors — small colored squares */}
            {factionWarriors.slice(0, 4).map(([faction, count], i) => (
              <g key={faction} transform={`translate(${-20 + i * 12}, ${radius - 18})`}>
                <rect
                  width="10" height="10"
                  rx="2"
                  fill={FACTION_COLORS[faction as Faction] ?? '#888'}
                />
                <text
                  x="5" y="9"
                  textAnchor="middle"
                  fontSize="7"
                  fill="white"
                  fontWeight="bold"
                >
                  {count}
                </text>
              </g>
            ))}

            {/* Buildings — small icons */}
            {buildings.slice(0, 3).map((b, i) => b && (
              <g key={i} transform={`translate(${-14 + i * 14}, -radius + 2}`}>
                <rect
                  x={-14 + i * 14}
                  y={-radius + 4}
                  width="12" height="10"
                  rx="2"
                  fill={FACTION_COLORS[b.faction] ?? '#888'}
                  opacity="0.9"
                />
                <text
                  x={-14 + i * 14 + 6}
                  y={-radius + 12}
                  textAnchor="middle"
                  fontSize="6"
                  fill="white"
                >
                  {b.type === 'sawmill' ? 'S' : b.type === 'recruiter' ? 'R' : b.type === 'workshop' ? 'W' : b.type === 'roost' ? 'Ro' : 'B'}
                </text>
              </g>
            ))}

            {/* Slot count */}
            <text
              textAnchor="middle"
              y={radius - 4}
              fontSize="9"
              fill="#888"
            >
              {clearing.buildings.filter(Boolean).length}/{clearing.slots}
            </text>
          </g>
        )
      })}

      {/* Legend */}
      <g transform="translate(10, 490)">
        {(['marquise', 'eyrie', 'alliance', 'vagabond'] as Faction[]).map((f, i) => (
          <g key={f} transform={`translate(${i * 130}, 0)`}>
            <rect width="12" height="12" rx="2" fill={FACTION_COLORS[f]} />
            <text x="16" y="10" fontSize="10" fill="#aaa" fontFamily="Georgia, serif">
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </text>
          </g>
        ))}
        <g transform="translate(520, 0)">
          <text fontSize="9" fill="#666">S=Sawmill R=Recruiter W=Workshop Ro=Roost</text>
        </g>
      </g>
    </svg>
  )
}
