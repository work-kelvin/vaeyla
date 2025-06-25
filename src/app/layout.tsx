'use client'
import './globals.css'
import { ReactNode, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Session, AuthChangeEvent, AuthUser } from '@supabase/supabase-js'

export default function RootLayout({ children }: { children: ReactNode }) {
  /* ----------- realtime auth listener ----------- */
  const [loading, setLoading] = useState(true)
  const [_user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    console.log('🚀 [RootLayout] Subscribing to auth changes')
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session ? session.user : null)
        setLoading(false)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <p className="p-6 text-center">Loading…</p>

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  )
}
