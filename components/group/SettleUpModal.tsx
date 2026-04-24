"use client"
import React, { useState } from 'react'
import { createSettlement } from '@/data/queries/settlements'
import { formatCurrency, parseToPaisa } from '@/lib/formatters'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import confetti from 'canvas-confetti'

interface SettleUpModalProps {
  groupId: string
  toId: string
  toName: string
  maxAmount: number // paisa
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function SettleUpModal({ groupId, toId, toName, maxAmount, isOpen, onClose, onSuccess }: SettleUpModalProps) {
  const { user } = useAuth()
  const { showToast } = useToast()
  
  // By default, suggest the max amount
  const [amountInput, setAmountInput] = useState((maxAmount / 100).toString())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const parsed = parseFloat(amountInput)
    if (isNaN(parsed) || parsed <= 0) {
      setError('Enter a valid amount')
      return
    }

    const paisa = parseToPaisa(amountInput)
    if (paisa > maxAmount) {
      setError(`You only owe ${formatCurrency(maxAmount)}. You cannot over-settle.`)
      return
    }

    setLoading(true)
    try {
      if (!user) throw new Error('Not authenticated')
      await createSettlement(groupId, user.id, toId, paisa)
      // Throw confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFFFFF', '#A1A1AA', '#52525B']
      })
      showToast('Payment settled!', 'success')
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to settle up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settle Up">
      <form onSubmit={handleSettle} className="flex flex-col gap-4">
        <p className="text-[var(--text-secondary)] text-sm mb-2">
          Record a payment you made to <strong>{toName}</strong>. 
          This will reduce your debt in the ledger.
        </p>

        {error && <div className="bg-[var(--negative-dim)] text-[var(--negative)] p-3 rounded-lg text-sm">{error}</div>}

        <div>
          <label className="block text-sm mb-1 text-[var(--text-secondary)] font-medium">Amount to settle</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] font-bold">₨</span>
            <input
              type="text"
              inputMode="decimal"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              required
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg pl-8 pr-4 py-3 outline-none focus:border-[var(--text-primary)] font-mono text-lg"
            />
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2">Maximum you owe: {formatCurrency(maxAmount)}</p>
        </div>

        <div className="mt-4 flex gap-4">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" isLoading={loading} className="flex-1">Settle</Button>
        </div>
      </form>
    </Modal>
  )
}
