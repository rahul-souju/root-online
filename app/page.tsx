'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  const [joinCode, setJoinCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [view, setView] = useState<'auth' | 'play'>('auth')

  // Check if already logged in
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setView('play')
    })
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        // Auto sign-in after sign-up
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) setError(signInError.message)
        else setView('play')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else setView('play')
    }
    setIsLoading(false)
  }

  const handleCreateRoom = async () => {
    setIsLoading(true)
    setError(null)
    const res = await fetch('/api/rooms', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to create room')
    } else {
      router.push(`/lobby/${data.roomId}?code=${data.code}`)
    }
    setIsLoading(false)
  }

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    setIsLoading(true)
    setError(null)

    const res = await fetch(`/api/rooms/${joinCode.toUpperCase()}/join`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to join room')
    } else {
      router.push(`/lobby/${data.roomId}?code=${joinCode.toUpperCase()}`)
    }
    setIsLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setView('auth')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at top, #1a2f1e 0%, #0f1a10 60%)' }}>

      {/* Title */}
      <div className="text-center mb-12">
        <h1 className="font-serif text-6xl font-bold mb-3" style={{ color: '#D4A848' }}>
          Root Online
        </h1>
        <p className="text-gray-400 text-lg italic font-serif">
          A Game of Woodland Might and Right — on the Web
        </p>
        <div className="flex justify-center gap-4 mt-4 text-3xl">
          <span title="Marquise de Cat">🐱</span>
          <span title="Eyrie Dynasties">🦅</span>
          <span title="Woodland Alliance">🌿</span>
          <span title="Vagabond">🦡</span>
        </div>
      </div>

      {/* Auth card */}
      {view === 'auth' && (
        <div className="w-full max-w-sm rounded-2xl p-8 space-y-6"
          style={{ background: '#111d13', border: '1px solid #2D6A4F' }}>

          <h2 className="font-serif text-xl text-center" style={{ color: '#D4A848' }}>
            {isSignUp ? 'Create Account' : 'Sign In to Play'}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:border-green-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:border-green-600 outline-none"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50 hover:brightness-110 active:scale-95"
              style={{ background: '#2D6A4F', color: 'white' }}
            >
              {isLoading ? (isSignUp ? 'Creating...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(null) }}
              className="underline hover:text-gray-300 transition-colors"
              style={{ color: '#D4A848' }}
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      )}

      {/* Play card */}
      {view === 'play' && (
        <div className="w-full max-w-sm space-y-4">
          {/* Create room */}
          <div className="rounded-2xl p-6 space-y-4"
            style={{ background: '#111d13', border: '1px solid #2D6A4F' }}>
            <h2 className="font-serif text-lg" style={{ color: '#D4A848' }}>
              Host a Game
            </h2>
            <p className="text-gray-400 text-sm">
              Create a new room and share the 4-letter code with up to 3 friends.
            </p>
            <button
              onClick={handleCreateRoom}
              disabled={isLoading}
              className="w-full py-3 rounded-lg font-serif font-semibold text-black transition-all hover:brightness-110 disabled:opacity-50 active:scale-95"
              style={{ background: '#D4A848' }}
            >
              {isLoading ? 'Creating...' : 'Create Room'}
            </button>
          </div>

          {/* Join room */}
          <div className="rounded-2xl p-6 space-y-4"
            style={{ background: '#111d13', border: '1px solid #374c38' }}>
            <h2 className="font-serif text-lg text-gray-200">
              Join a Game
            </h2>
            <form onSubmit={handleJoinRoom} className="space-y-3">
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="WOLF"
                maxLength={4}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-center text-2xl font-mono tracking-widest placeholder-gray-600 uppercase focus:border-green-600 outline-none"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={isLoading || joinCode.length !== 4}
                className="w-full py-2.5 rounded-lg font-semibold transition-all disabled:opacity-40 hover:brightness-110 active:scale-95"
                style={{ background: '#2D6A4F', color: 'white' }}
              >
                {isLoading ? 'Joining...' : 'Join Room'}
              </button>
            </form>
          </div>

          {/* Sign out */}
          <div className="text-center">
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-600 hover:text-gray-400 underline"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="mt-12 text-gray-700 text-xs text-center">
        Root Online · Built on Vercel + Supabase · 2–4 players per room
      </p>
    </div>
  )
}
