"use client"
import React, { useState } from 'react'
import { sendInvite } from '@/data/queries/invites'
import { isValidEmail } from '@/lib/validators'
import { useToast } from '@/context/ToastContext'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Mail } from 'lucide-react'

interface InviteMemberModalProps {
  groupId: string
  isOpen: boolean
  onClose: () => void
}

export function InviteMemberModal({ groupId, isOpen, onClose }: InviteMemberModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { showToast } = useToast()

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmed = email.trim()
    if (!isValidEmail(trimmed)) {
      setError('Please enter a valid email')
      return
    }

    setLoading(true)
    try {
      await sendInvite(groupId, trimmed)
      showToast('Invite sent successfully', 'success')
      setEmail('')
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send invite')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Member">
      <form onSubmit={handleInvite} className="flex flex-col gap-4">
        <p className="text-[var(--text-secondary)] text-sm mb-2">
          Enter the email address of the person you want to invite. They must have a FlowSplit account.
        </p>

        {error && <div className="bg-negative/10 text-negative p-3 rounded-lg text-sm">{error}</div>}

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg pl-10 pr-4 py-3 outline-none focus:border-accent"
          />
        </div>

        <Button type="submit" isLoading={loading} className="mt-4">
          Send Invite
        </Button>
      </form>
    </Modal>
  )
}
