"use client"
import React, { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    async function verifyAuth() {
      if (!loading && !user) {
        // Double check session to prevent race conditions during login route transitions
        const { data } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession())
        if (!data.session) {
          router.replace('/login')
        }
      }
    }
    verifyAuth()
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
