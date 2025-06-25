'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return setError(error.message)
    router.push('/dashboard')
  }

  return (
    <main className="flex flex-col gap-4 max-w-sm mx-auto pt-20 px-4">
      <h1 className="text-2xl font-bold text-center">Vaelya Login</h1>

      <input
        className="border rounded p-3 w-full"
        placeholder="Email"
        autoComplete="email"
        onChange={e => setEmail(e.target.value)}
        value={email}
      />
      <input
        className="border rounded p-3 w-full"
        placeholder="Password"
        type="password"
        autoComplete="current-password"
        onChange={e => setPassword(e.target.value)}
        value={password}
      />

      <button
        onClick={handleLogin}
        disabled={loading}
        className="bg-black text-white rounded p-3 active:scale-95"
      >
        {loading ? 'Logging in…' : 'Login'}
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <p className="text-center text-sm pt-4">
        No account? <a href="/signup" className="underline">Sign Up</a>
      </p>
    </main>
  )
} 