"use client"
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useState } from 'react'
import { GroupInvite } from '@/data/types'
import { fetchPendingInvites, acceptInvite, declineInvite } from '@/data/queries/invites'
import { useToast } from '@/context/ToastContext'
import { useNotifications } from '@/context/NotificationContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonListItem } from '@/components/ui/Skeleton'
import { Bell } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function NotificationsPage() {
  const [invites, setInvites] = useState<GroupInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null) // invite id
  
  const { showToast } = useToast()
  const { refetchCount } = useNotifications()
  const router = useRouter()

  const load = useCallback(async () => {
    try {
      const data = await fetchPendingInvites()
      setInvites(data)
    } catch {
      showToast('Failed to load notifications', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    load()
  }, [load])

  const handleAccept = async (invite: GroupInvite) => {
    setActionLoading(invite.id)
    try {
      await acceptInvite(invite.id, invite.group_id)
      showToast(`Joined ${invite.group?.name}!`, 'success')
      setInvites(prev => prev.filter(i => i.id !== invite.id))
      refetchCount()
      router.push(`/group/${invite.group_id}`)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to accept invite', 'error')
      setActionLoading(null)
    }
  }

  const handleDecline = async (inviteId: string) => {
    setActionLoading(inviteId)
    try {
      await declineInvite(inviteId)
      showToast('Invite declined', 'info')
      setInvites(prev => prev.filter(i => i.id !== inviteId))
      refetchCount()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to decline invite', 'error')
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="px-4 space-y-4">
        <h1 className="text-3xl font-bold font-clash mb-6">Notifications</h1>
        <SkeletonListItem />
        <SkeletonListItem />
      </div>
    )
  }

  return (
    <div className="px-4 md:px-0 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-clash">Notifications</h1>
          <p className="text-[var(--text-secondary)]">Manage your invites and alerts</p>
        </div>
      </div>

      {invites.length === 0 ? (
        <EmptyState 
          icon={Bell} 
          title="All caught up!" 
          description="You don't have any pending invites or notifications right now."
        />
      ) : (
        <div className="space-y-4">
           <AnimatePresence>
             {invites.map(invite => (
                <motion.div
                   key={invite.id}
                   layout
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="flex flex-col gap-4">
                     <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-[var(--bg-primary)] border border-[var(--border)] rounded-full flex items-center justify-center text-2xl shrink-0">
                           {invite.group?.emoji}
                        </div>
                        <div className="flex-1">
                           <h3 className="font-bold text-[var(--text-primary)]">Group Invitation</h3>
                           <p className="text-sm text-[var(--text-secondary)] mt-1">
                             <strong>{invite.inviter?.name}</strong> invited you to join <strong>{invite.group?.name}</strong>.
                           </p>
                           <p className="text-xs text-[var(--text-secondary)] mt-2 opacity-70">
                             {new Date(invite.created_at).toLocaleDateString()}
                           </p>
                        </div>
                     </div>
                     <div className="flex gap-3 pt-2 border-t border-[var(--border)]">
                        <Button 
                          variant="ghost" 
                          className="flex-1 border border-[var(--border)] text-negative hover:bg-negative/10 hover:text-negative"
                          onClick={() => handleDecline(invite.id)}
                          disabled={actionLoading === invite.id}
                        >
                           Decline
                        </Button>
                        <Button 
                           className="flex-1"
                           onClick={() => handleAccept(invite)}
                           isLoading={actionLoading === invite.id}
                        >
                           Accept
                        </Button>
                     </div>
                  </Card>
                </motion.div>
             ))}
           </AnimatePresence>
        </div>
      )}
    </div>
  )
}
