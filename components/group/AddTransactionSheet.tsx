"use client"
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Adjustment, Profile, Settlement, SplitMode, Transaction } from '@/data/types'
import { createTransaction } from '@/data/queries/transactions'
import { fetchTransactions } from '@/data/queries/transactions'
import { fetchAdjustments } from '@/data/queries/adjustments'
import { fetchSettlements } from '@/data/queries/settlements'
import { formatCurrency } from '@/lib/formatters'
import { calculateSplits, distributeRemaining, validateExactAmounts, validatePercentages } from '@/lib/splitCalculator'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { getRawBalanceBetween } from '@/lib/ledger'
import { assertSplitIntegrity } from '@/lib/validators'
import { Minus, Plus } from 'lucide-react'
import { DebtPreview } from '@/components/group/DebtPreview'

interface AddTransactionSheetProps {
  groupId: string
  members: Profile[]
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const SPLIT_MODE_KEY = 'flowsplit_preferred_split_mode'
const panelVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15 } }
}

const categories = [
  { value: 'food', icon: '🍔' }, { value: 'transport', icon: '🚗' }, { value: 'entertainment', icon: '🎮' },
  { value: 'health', icon: '🏥' }, { value: 'shopping', icon: '🛒' }, { value: 'travel', icon: '✈️' },
  { value: 'rent', icon: '🏠' }, { value: 'other', icon: '📦' }
] as const

const normalizeTwoDecimals = (value: string) => {
  if (!value) return value
  const cleaned = value.replace(/[^0-9.]/g, '')
  const [intPart, decPart = ''] = cleaned.split('.')
  const trimmed = decPart.slice(0, 2)
  return cleaned.includes('.') ? `${intPart}.${trimmed}` : intPart
}

const toPaisaSafe = (raw: string) => {
  const parsed = Number.parseFloat(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) return 0
  return Math.round(parsed * 100)
}

export function AddTransactionSheet({ groupId, members, isOpen, onClose, onSuccess }: AddTransactionSheetProps) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const memberIds = useMemo(() => members.map((m) => m.id), [members])
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [payerId, setPayerId] = useState(user?.id ?? '')
  const [category, setCategory] = useState('other')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [splitMode, setSplitMode] = useState<SplitMode>('equal')
  const [equalIncludes, setEqualIncludes] = useState<Set<string>>(new Set(memberIds))
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({})
  const [shareValues, setShareValues] = useState<Record<string, number>>({})
  const [percentageValues, setPercentageValues] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  const [existingTransactions, setExistingTransactions] = useState<Transaction[]>([])
  const [existingAdjustments, setExistingAdjustments] = useState<Adjustment[]>([])
  const [existingSettlements, setExistingSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const amountPaisa = useMemo(() => toPaisaSafe(amount), [amount])

  useEffect(() => {
    if (!isOpen) return
    const preferred = localStorage.getItem(SPLIT_MODE_KEY) as SplitMode | null
    const safePreferred = preferred && ['equal', 'exact', 'shares', 'percentage', 'mine'].includes(preferred) ? preferred : 'equal'
    const evenPct = memberIds.length > 0 ? 100 / memberIds.length : 0
    const initialPct: Record<string, string> = {}
    const initialShares: Record<string, number> = {}
    const initialExact: Record<string, string> = {}
    memberIds.forEach((id) => {
      initialPct[id] = evenPct.toFixed(2)
      initialShares[id] = 1
      initialExact[id] = ''
    })
    setPayerId(user?.id ?? memberIds[0] ?? '')
    setSplitMode(safePreferred)
    setEqualIncludes(new Set(memberIds.filter((id) => id !== (user?.id ?? memberIds[0]))))
    setShareValues(initialShares)
    setPercentageValues(initialPct)
    setExactAmounts(initialExact)
    setTouchedFields(new Set())
    setError(null)
  }, [isOpen, memberIds, user?.id])

  useEffect(() => {
    if (!isOpen) return
    Promise.all([fetchTransactions(groupId), fetchAdjustments(groupId), fetchSettlements(groupId)])
      .then(([txns, adjs, settlements]) => {
        setExistingTransactions(txns)
        setExistingAdjustments(adjs)
        setExistingSettlements(settlements)
      })
      .catch(() => {
        setExistingTransactions([])
        setExistingAdjustments([])
        setExistingSettlements([])
      })
  }, [isOpen, groupId])

  useEffect(() => {
    if (amountPaisa <= 0 || members.length === 0) return
    if (Object.values(exactAmounts).some((v) => v !== '')) return
    const equalBase = Math.floor(amountPaisa / members.length)
    const remainder = amountPaisa % members.length
    const next: Record<string, string> = {}
    members.forEach((member) => {
      const share = equalBase + (member.id === payerId ? remainder : 0)
      next[member.id] = (share / 100).toFixed(2)
    })
    setExactAmounts(next)
  }, [amountPaisa, members, payerId, exactAmounts])

  const exactAmountsPaisa = useMemo(() => {
    const mapped: Record<string, number> = {}
    memberIds.forEach((id) => { mapped[id] = toPaisaSafe(exactAmounts[id] ?? '') })
    return mapped
  }, [exactAmounts, memberIds])

  const percentagesFloat = useMemo(() => {
    const mapped: Record<string, number> = {}
    memberIds.forEach((id) => {
      const v = Number.parseFloat(percentageValues[id] ?? '0')
      mapped[id] = Number.isFinite(v) ? v : 0
    })
    return mapped
  }, [percentageValues, memberIds])

  const splitResult = useMemo(() => {
    if (amountPaisa <= 0 || !payerId) return null
    try {
      return calculateSplits({
        mode: splitMode,
        totalAmount: amountPaisa,
        payerId,
        memberIds,
        equalIncludes: Array.from(equalIncludes),
        exactAmounts: exactAmountsPaisa,
        shareValues,
        percentageValues: percentagesFloat
      })
    } catch {
      return null
    }
  }, [amountPaisa, payerId, splitMode, memberIds, equalIncludes, exactAmountsPaisa, shareValues, percentagesFloat])

  const exactValidation = useMemo(() => validateExactAmounts(exactAmountsPaisa, amountPaisa), [exactAmountsPaisa, amountPaisa])
  const percentageValidation = useMemo(() => validatePercentages(percentagesFloat), [percentagesFloat])
  const totalShares = useMemo(() => Object.values(shareValues).reduce((a, b) => a + b, 0), [shareValues])
  const exactProgressAssigned = useMemo(() => Object.values(exactAmountsPaisa).reduce((a, b) => a + b, 0), [exactAmountsPaisa])
  const pctSum = useMemo(() => Object.values(percentagesFloat).reduce((a, b) => a + b, 0), [percentagesFloat])

  const modeIsValid = useMemo(() => {
    if (splitMode === 'exact') return exactValidation.valid
    if (splitMode === 'percentage') return percentageValidation.valid
    if (splitMode === 'shares') return totalShares > 0
    return true
  }, [splitMode, exactValidation.valid, percentageValidation.valid, totalShares])

  const isValid = Boolean(title.trim()) && amountPaisa > 0 && Boolean(splitResult) && modeIsValid && members.length >= 2

  const debtPreviewItems = useMemo(() => {
    if (!splitResult) return []
    const allSplits = existingTransactions.flatMap((t) => t.splits || [])
    return splitResult.debts.map((debt) => {
      const before = getRawBalanceBetween(
        existingTransactions,
        allSplits,
        existingAdjustments,
        existingSettlements,
        debt.debtorId,
        debt.creditorId
      )
      const after = before + debt.amount
      return {
        ...debt,
        isIncrease: Math.abs(after) >= Math.abs(before),
        debtorName: members.find((m) => m.id === debt.debtorId)?.name ?? 'Unknown',
        creditorName: members.find((m) => m.id === debt.creditorId)?.name ?? 'Unknown'
      }
    })
  }, [splitResult, existingTransactions, existingAdjustments, existingSettlements, members])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!isValid || !splitResult) return

    try {
      setLoading(true)
      assertSplitIntegrity(splitResult.splits, amountPaisa)
      await createTransaction(groupId, title.trim(), amountPaisa, payerId, category, date, splitResult.splits, splitMode)
      showToast(`"${title.trim()}" added`, 'success')
      reset()
      onSuccess()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add transaction'
      setError(message)
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setTitle('')
    setAmount('')
    setPayerId(user?.id || '')
    setSplitMode('equal')
    setEqualIncludes(new Set(memberIds.filter((id) => id !== payerId)))
    setTouchedFields(new Set())
    onClose()
  }

  const handleModeChange = (mode: SplitMode) => {
    setSplitMode(mode)
    localStorage.setItem(SPLIT_MODE_KEY, mode)
  }

  const onAmountChange = (raw: string) => {
    const normalized = normalizeTwoDecimals(raw)
    if (raw.includes('.') && raw.split('.')[1]?.length > 2) {
      showToast(`Rounded to ₨${Number.parseFloat(normalized || '0').toFixed(2)}`, 'info')
    }
    setAmount(normalized)
  }

  const toggleMemberInEqual = (memberId: string) => {
    setEqualIncludes((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) {
        if (next.size === 1) return prev
        next.delete(memberId)
      } else {
        next.add(memberId)
      }
      if (next.size === 0) {
        handleModeChange('mine')
        showToast("Switched to 'Only you' since no one else is included", 'info')
      }
      return next
    })
  }

  const onPayerChange = (id: string) => {
    if (payerId !== id && amountPaisa > 0 && (splitMode === 'equal' || splitMode === 'shares')) {
      showToast('Split recalculated for new payer', 'info')
    }
    setPayerId(id)
    setEqualIncludes((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const distributeExactRemaining = () => {
    const untouched = memberIds.filter((id) => !touchedFields.has(`exact:${id}`))
    const updated = distributeRemaining(exactAmountsPaisa, amountPaisa, untouched)
    const asRupee: Record<string, string> = {}
    memberIds.forEach((id) => { asRupee[id] = (updated[id] / 100).toFixed(2) })
    setExactAmounts(asRupee)
  }

  const distributePercentRemaining = () => {
    const untouched = memberIds.filter((id) => !touchedFields.has(`pct:${id}`))
    if (untouched.length === 0) return
    const assigned = Object.values(percentagesFloat).reduce((a, b) => a + b, 0)
    const remaining = Math.max(0, 100 - assigned)
    const per = Math.floor((remaining / untouched.length) * 100) / 100
    const remainder = Number((remaining - (per * untouched.length)).toFixed(2))
    const next = { ...percentageValues }
    untouched.forEach((id) => {
      const current = Number.parseFloat(next[id] || '0')
      next[id] = (current + per).toFixed(2)
    })
    if (untouched[0]) {
      const current = Number.parseFloat(next[untouched[0]] || '0')
      next[untouched[0]] = (current + remainder).toFixed(2)
    }
    setPercentageValues(next)
  }

  const progressColor =
    splitMode === 'percentage'
      ? percentageValidation.valid ? '#22C55E' : percentageValidation.remaining < 0 ? '#EF4444' : '#F59E0B'
      : exactValidation.valid ? '#22C55E' : exactValidation.diff < 0 ? '#EF4444' : '#F59E0B'

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Add Expense">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && <div className="bg-[var(--negative-dim)] text-[var(--negative)] p-3 rounded-[var(--radius-md)] text-sm">{error}</div>}
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What was this for?" className="h-12 rounded-[var(--radius-md)] px-4 border border-[var(--border-subtle)] bg-[var(--bg-input)]" />
        <div className="flex items-center justify-center text-5xl font-semibold font-clash">
          <span className="text-[var(--text-secondary)] mr-2">₨</span>
          <input inputMode="decimal" value={amount} onChange={(e) => onAmountChange(e.target.value)} placeholder="0" className="w-48 bg-transparent text-center outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-[var(--text-secondary)] mb-2">Paid by</p>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <button key={m.id} type="button" onClick={() => onPayerChange(m.id)} className={`h-11 px-3 rounded-full border text-sm ${payerId === m.id ? 'bg-[var(--brand-dim)] border-[var(--brand)] text-[var(--brand)]' : 'bg-[var(--bg-input)] border-[var(--border-subtle)] text-[var(--text-secondary)]'}`}>{m.name.slice(0, 2).toUpperCase()}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)] mb-2">Date</p>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 w-full rounded-[var(--radius-md)] px-3 border border-[var(--border-subtle)] bg-[var(--bg-input)]" />
            <p className="text-xs text-[var(--text-secondary)] mt-2">Category</p>
            <div className="grid grid-cols-4 gap-1 mt-1">
              {categories.map((item) => (
                <button key={item.value} type="button" onClick={() => setCategory(item.value)} className={`h-10 rounded-[var(--radius-sm)] border ${category === item.value ? 'border-[var(--brand)] bg-[var(--brand-dim)]' : 'border-[var(--border-subtle)] bg-[var(--bg-input)]'}`}>{item.icon}</button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs text-[var(--text-secondary)] mb-2">Split Mode</p>
          <div className="grid grid-cols-5 gap-1 bg-[var(--bg-input)] p-1 rounded-full">
            {(['equal', 'exact', 'shares', 'percentage', 'mine'] as SplitMode[]).map((mode) => (
              <button key={mode} type="button" onClick={() => handleModeChange(mode)} className={`h-9 rounded-full text-xs ${splitMode === mode ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-secondary)]'}`}>{mode === 'percentage' ? '%' : mode}</button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={splitMode} variants={panelVariants} initial="initial" animate="animate" exit="exit" className="space-y-2">
            {splitMode === 'equal' && members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => (m.id !== payerId ? toggleMemberInEqual(m.id) : undefined)}
                className={`w-full p-3 rounded-[var(--radius-md)] border flex justify-between ${equalIncludes.has(m.id) ? 'border-[var(--brand)]' : 'border-[var(--border-subtle)] opacity-50'} ${m.id === payerId ? 'cursor-not-allowed' : ''}`}
              >
                <span>{m.name}</span>
                <span className="font-mono">
                  {m.id === payerId ? 'Payer share' : ''}
                  {amountPaisa > 0 && splitResult ? (splitResult.splits[m.id] ? ` ${formatCurrency(splitResult.splits[m.id])}` : ' —') : ' —'}
                </span>
              </button>
            ))}

            {splitMode === 'exact' && (
              <>
                {members.map((m) => (
                  <div key={m.id} className="w-full p-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] flex justify-between items-center gap-2">
                    <span>{m.name}</span>
                    <div className="flex items-center gap-1"><span>₨</span><input inputMode="decimal" value={exactAmounts[m.id] ?? ''} onChange={(e) => { setTouchedFields((prev) => new Set(prev).add(`exact:${m.id}`)); setExactAmounts((prev) => ({ ...prev, [m.id]: normalizeTwoDecimals(e.target.value) })) }} className="w-24 h-9 text-right rounded bg-[var(--bg-input)] px-2 font-mono" /></div>
                  </div>
                ))}
                <div className="mt-2">
                  <div className="h-2 rounded-full bg-[var(--bg-input)] overflow-hidden"><motion.div layout className="h-full" style={{ width: `${amountPaisa > 0 ? Math.min(100, (exactProgressAssigned / amountPaisa) * 100) : 0}%`, backgroundColor: progressColor }} /></div>
                  <p className="text-xs mt-1 text-[var(--text-secondary)]">₨{(exactProgressAssigned / 100).toLocaleString()} / ₨{(amountPaisa / 100).toLocaleString()} {exactValidation.valid ? '✓' : exactValidation.message}</p>
                  {!exactValidation.valid && exactValidation.diff > 0 && <button type="button" onClick={distributeExactRemaining} className="text-xs text-[var(--brand)] mt-1">Split remaining equally</button>}
                </div>
              </>
            )}

            {splitMode === 'shares' && (
              <>
                {members.map((m) => (
                  <div key={m.id} className={`w-full p-3 rounded-[var(--radius-md)] border flex justify-between items-center ${shareValues[m.id] === 0 ? 'opacity-50 border-[var(--border-subtle)]' : 'border-[var(--border-default)]'}`}>
                    <span>{m.name}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setShareValues((prev) => ({ ...prev, [m.id]: Math.max(0, (prev[m.id] ?? 0) - 1) }))}><Minus size={14} /></button>
                      <input inputMode="numeric" value={shareValues[m.id] ?? 0} onChange={(e) => setShareValues((prev) => ({ ...prev, [m.id]: Math.max(0, Math.min(99, Number.parseInt(e.target.value || '0', 10) || 0)) }))} className="w-10 text-center bg-transparent" />
                      <button type="button" onClick={() => setShareValues((prev) => ({ ...prev, [m.id]: Math.min(99, (prev[m.id] ?? 0) + 1) }))}><Plus size={14} /></button>
                    </div>
                    <span className="font-mono">{splitResult?.splits[m.id] ? formatCurrency(splitResult.splits[m.id]) : '—'}</span>
                  </div>
                ))}
                <p className="text-xs text-[var(--text-secondary)]">Total: {totalShares} shares | 1 share = {totalShares > 0 && amountPaisa > 0 ? formatCurrency(Math.floor(amountPaisa / totalShares)) : '—'}</p>
              </>
            )}

            {splitMode === 'percentage' && (
              <>
                {members.map((m) => (
                  <div key={m.id} className="w-full p-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] flex justify-between items-center gap-2">
                    <span>{m.name}</span>
                    <div className="flex items-center gap-1"><input inputMode="decimal" value={percentageValues[m.id] ?? ''} onChange={(e) => { setTouchedFields((prev) => new Set(prev).add(`pct:${m.id}`)); setPercentageValues((prev) => ({ ...prev, [m.id]: normalizeTwoDecimals(e.target.value) })) }} className="w-16 h-9 text-right rounded bg-[var(--bg-input)] px-2 font-mono" /><span>%</span><span className="font-mono w-20 text-right">{splitResult?.splits[m.id] ? formatCurrency(splitResult.splits[m.id]) : '—'}</span></div>
                  </div>
                ))}
                <div className="mt-2">
                  <div className="h-2 rounded-full bg-[var(--bg-input)] overflow-hidden"><motion.div layout className="h-full" style={{ width: `${Math.min(100, Math.max(0, pctSum))}%`, backgroundColor: progressColor }} /></div>
                  <p className="text-xs mt-1 text-[var(--text-secondary)]">{pctSum.toFixed(2)}% / 100% {percentageValidation.valid ? '✓' : percentageValidation.message}</p>
                  {!percentageValidation.valid && percentageValidation.remaining > 0 && <button type="button" onClick={distributePercentRemaining} className="text-xs text-[var(--brand)] mt-1">Distribute remaining equally</button>}
                </div>
              </>
            )}

            {splitMode === 'mine' && (
              <div className="p-4 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-input)]">
                <p>Full amount assigned to {members.find((m) => m.id === payerId)?.name ?? 'payer'}</p>
                <p className="text-sm text-[var(--text-secondary)]">No debt will be created for other members.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <DebtPreview amountPaisa={amountPaisa} title={title} items={debtPreviewItems} />

        <Button type="submit" size="lg" isLoading={loading} disabled={!isValid}>
          {isValid ? 'Add Expense' : 'Enter amount to continue'}
        </Button>
      </form>
    </BottomSheet>
  )
}
