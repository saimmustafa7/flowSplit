"use client"
import React, { useState } from 'react'
import { Profile } from '@/data/types'
import { leaveGroup, removeMember, deleteGroup } from '@/data/queries/groups'
import { useToast } from '@/context/ToastContext'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Crown, LogOut, UserMinus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MembersSheetProps {
  groupId: string
  groupCreatorId: string
  currentUserId: string
  members: Profile[]
  isOpen: boolean
  onClose: () => void
  onMemberRemoved: (userId: string) => void
}

export function MembersSheet({
  groupId,
  groupCreatorId,
  currentUserId,
  members,
  isOpen,
  onClose,
  onMemberRemoved,
}: MembersSheetProps) {
  const { showToast } = useToast()
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [leavingGroup, setLeavingGroup] = useState(false)

  const isCreator = currentUserId === groupCreatorId

  const handleRemove = async (member: Profile) => {
    if (!confirm(`Remove ${member.name} from this group?`)) return
    setLoadingId(member.id)
    try {
      await removeMember(groupId, member.id)
      onMemberRemoved(member.id)
      showToast(`${member.name} removed from group`, 'info')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to remove member', 'error')
    } finally {
      setLoadingId(null)
    }
  }

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return
    setLeavingGroup(true)
    try {
      await leaveGroup(groupId)
      showToast('You have left the group', 'info')
      onClose()
      router.push('/group')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to leave group', 'error')
    } finally {
      setLeavingGroup(false)
    }
  }

  const handleDeleteGroup = async () => {
    const confirmation = confirm('DANGER: This will permanently delete the group and all its transactions. This cannot be undone. Are you absolutely sure?')
    if (!confirmation) return
    
    setLeavingGroup(true) // Reuse loading state for simplicity
    try {
      await deleteGroup(groupId)
      showToast('Group deleted permanently', 'info')
      onClose()
      router.push('/group')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete group', 'error')
    } finally {
      setLeavingGroup(false)
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Members">
      <div className="flex flex-col gap-2">
        {members.map((member) => {
          const isMemberCreator = member.id === groupCreatorId
          const isSelf = member.id === currentUserId
          const initials = member.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-sm font-bold text-[var(--text-primary)]">
                  {initials}
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)] text-sm">
                    {member.name}
                    {isSelf && (
                      <span className="ml-1 text-xs text-[var(--text-secondary)]">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isMemberCreator && (
                  <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                    <Crown size={13} />
                    Owner
                  </span>
                )}
                {/* Creator can remove non-creator, non-self members */}
                {isCreator && !isMemberCreator && !isSelf && (
                  <button
                    onClick={() => handleRemove(member)}
                    disabled={loadingId === member.id}
                    className="flex items-center gap-1 text-xs text-[var(--negative)] border border-[var(--negative)]/30 rounded-lg px-2 py-1 hover:bg-[var(--negative)]/10 transition-colors disabled:opacity-50"
                  >
                    {loadingId === member.id ? (
                      '...'
                    ) : (
                      <>
                        <UserMinus size={12} /> Remove
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {/* Leave group — shown to non-creators only */}
        {!isCreator && (
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <Button
              variant="ghost"
              onClick={handleLeave}
              isLoading={leavingGroup}
              className="w-full gap-2 text-[var(--negative)] border border-[var(--negative)]/30 hover:bg-[var(--negative)]/10"
            >
              <LogOut size={16} />
              Leave Group
            </Button>
          </div>
        )}

        {/* Admin actions */}
        {isCreator && (
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <Button
              variant="danger"
              onClick={handleDeleteGroup}
              isLoading={leavingGroup}
              className="w-full gap-2 text-negative border border-negative/30 hover:bg-negative/10"
            >
              <Trash2 size={16} />
              Delete Group
            </Button>
            <p className="text-[10px] text-center text-[var(--text-tertiary)] mt-2">
              Only you as the owner can see this action.
            </p>
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
