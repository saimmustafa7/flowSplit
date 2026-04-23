"use client"
/* eslint-disable react-hooks/set-state-in-effect */
import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'

interface NotificationContextType {
  pendingCount: number
  refetchCount: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)

  const refetchCount = useCallback(async () => {
    if (!user) return
    const { count, error } = await supabase
      .from('group_invites')
      .select('*', { count: 'exact', head: true })
      .eq('invited_user_id', user.id)
      .eq('status', 'pending')

    if (!error && count !== null) {
      setPendingCount(count)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setPendingCount(0)
      return
    }

    refetchCount()

    // Realtime subscription
    const channel = supabase
      .channel(`invites-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_invites',
          filter: `invited_user_id=eq.${user.id}`
        },
        () => {
          refetchCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, refetchCount])

  return (
    <NotificationContext.Provider value={{ pendingCount, refetchCount }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within provider')
  return context
}
