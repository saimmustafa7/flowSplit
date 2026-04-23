import { assertSplitIntegrity } from './validators'

export type SplitMode = 'equal' | 'exact' | 'shares' | 'percentage' | 'mine'

export interface SplitInput {
  mode: SplitMode
  totalAmount: number
  payerId: string
  memberIds: string[]
  equalIncludes?: string[]
  exactAmounts?: Record<string, number>
  shareValues?: Record<string, number>
  percentageValues?: Record<string, number>
}

export interface DebtEntry {
  debtorId: string
  creditorId: string
  amount: number
}

export interface SplitResult {
  splits: Record<string, number>
  debts: DebtEntry[]
  mode: SplitMode
}

export function calculateSplits(input: SplitInput): SplitResult {
  const { mode, totalAmount, payerId } = input
  if (totalAmount <= 0) throw new Error('Amount must be greater than 0')

  let splits: Record<string, number> = {}

  switch (mode) {
    case 'equal': {
      const includedNonPayers = (input.equalIncludes ?? input.memberIds).filter((id) => id !== payerId)
      const participantCount = includedNonPayers.length + 1 // payer is always a participant in equal split
      if (participantCount <= 0) throw new Error('At least one member must be included')
      const base = Math.floor(totalAmount / participantCount)
      const remainder = totalAmount % participantCount

      includedNonPayers.forEach((id) => {
        splits[id] = base
      })
      splits[payerId] = (splits[payerId] ?? 0) + base + remainder
      break
    }
    case 'exact': {
      splits = { ...(input.exactAmounts ?? {}) }
      break
    }
    case 'shares': {
      const shareValues = input.shareValues ?? {}
      const totalShares = Object.values(shareValues).reduce((a, b) => a + b, 0)
      if (totalShares === 0) throw new Error('Total shares cannot be 0')
      let runningTotal = 0
      for (const [id, shares] of Object.entries(shareValues)) {
        if (shares > 0) {
          splits[id] = Math.floor((shares / totalShares) * totalAmount)
          runningTotal += splits[id]
        }
      }
      const remainder = totalAmount - runningTotal
      splits[payerId] = (splits[payerId] ?? 0) + remainder
      break
    }
    case 'percentage': {
      const percentages = input.percentageValues ?? {}
      let runningTotal = 0
      let highestNonPayerAmount = 0
      let highestNonPayerId = payerId

      for (const [id, pct] of Object.entries(percentages)) {
        if (pct > 0) {
          splits[id] = Math.floor((pct / 100) * totalAmount)
          runningTotal += splits[id]
          if (id !== payerId && splits[id] > highestNonPayerAmount) {
            highestNonPayerAmount = splits[id]
            highestNonPayerId = id
          }
        }
      }

      const remainder = totalAmount - runningTotal
      splits[highestNonPayerId] = (splits[highestNonPayerId] ?? 0) + remainder
      break
    }
    case 'mine': {
      splits[payerId] = totalAmount
      break
    }
  }

  assertSplitIntegrity(splits, totalAmount)

  const debts: DebtEntry[] = Object.entries(splits)
    .filter(([id, amount]) => id !== payerId && amount > 0)
    .map(([id, amount]) => ({
      debtorId: id,
      creditorId: payerId,
      amount
    }))

  return { splits, debts, mode }
}

export function validateExactAmounts(
  amounts: Record<string, number>,
  total: number
): { valid: boolean; diff: number; message: string } {
  const sum = Object.values(amounts).reduce((a, b) => a + b, 0)
  const diff = total - sum
  if (diff === 0) return { valid: true, diff: 0, message: '' }
  if (diff > 0) return { valid: false, diff, message: `₨${diff / 100} still unassigned` }
  return { valid: false, diff, message: `₨${Math.abs(diff) / 100} over-assigned` }
}

export function validatePercentages(
  percentages: Record<string, number>
): { valid: boolean; remaining: number; message: string } {
  const sum = Object.values(percentages).reduce((a, b) => a + b, 0)
  const remaining = 100 - sum
  const tolerance = 0.01
  if (Math.abs(remaining) <= tolerance) return { valid: true, remaining: 0, message: '' }
  if (remaining > 0) return { valid: false, remaining, message: `${remaining.toFixed(2)}% still unassigned` }
  return { valid: false, remaining, message: `${Math.abs(remaining).toFixed(2)}% over 100%` }
}

export function distributeRemaining(
  current: Record<string, number>,
  total: number,
  untouchedIds: string[]
): Record<string, number> {
  if (untouchedIds.length === 0) return current
  const assigned = Object.values(current).reduce((a, b) => a + b, 0)
  const remaining = total - assigned
  const perPerson = Math.floor(remaining / untouchedIds.length)
  const remainder = remaining % untouchedIds.length
  const updated = { ...current }
  untouchedIds.forEach((id) => {
    updated[id] = (updated[id] ?? 0) + perPerson
  })
  updated[untouchedIds[0]] = (updated[untouchedIds[0]] ?? 0) + remainder
  return updated
}
