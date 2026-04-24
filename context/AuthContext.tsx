"use client"
import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/data/types'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Timeout-guarded profile fetch — never hangs more than 4s
async function fetchProfileSafe(userId: string): Promise<Profile | null> {
  try {
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000))
    const query = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.warn('Profile fetch error:', error.message)
          return null
        }
        return data as Profile
      })
    return await Promise.race([query, timeout])
  } catch (e) {
    console.warn('Profile fetch failed/timed out:', e)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)
  const router = useRouter()

  const refreshProfile = async (userId?: string) => {
    const id = userId || user?.id
    if (!id) return
    const data = await fetchProfileSafe(id)
    if (data && mountedRef.current) {
      setProfile(data)
    }
  }

  useEffect(() => {
    mountedRef.current = true

    // Safety timeout — no matter what, stop showing the spinner after 6 seconds
    const safetyTimer = setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false)
      }
    }, 6000)

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (mountedRef.current) {
          setSession(session)
          setUser(session?.user ?? null)
          if (session?.user) {
            const profileData = await fetchProfileSafe(session.user.id)
            if (mountedRef.current && profileData) {
              setProfile(profileData)
            }
          }
        }
      } catch (e) {
        console.error('Session init error:', e)
      } finally {
        if (mountedRef.current) setLoading(false)
      }
    }

    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mountedRef.current) {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          const profileData = await fetchProfileSafe(session.user.id)
          if (mountedRef.current && profileData) {
            setProfile(profileData)
          }
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    })

    return () => {
      mountedRef.current = false
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

