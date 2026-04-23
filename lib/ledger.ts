import { Profile, Transaction, Split, Adjustment, Settlement, MinimalPayment } from '@/data/types'
import { formatCurrency } from './formatters'

// How much does userA owe userB (positive) or is owed by userB (negative)?
export function getRawBalanceBetween(
  transactions: Transaction[],
  splits: Split[],
  adjustments: Adjustment[],
  settlements: Settlement[],
  userAId: string,
  userBId: string
): number {

  let balance = 0

  // From transactions:
  for (const txn of transactions) {
    const aSplit = splits.find(s => s.transaction_id === txn.id && s.user_id === userAId)
    const bSplit = splits.find(s => s.transaction_id === txn.id && s.user_id === userBId)

    if (txn.paid_by === userBId && aSplit) {
      // B paid, A has a split → A owes B → positive for A
      balance += aSplit.amount
    }
    if (txn.paid_by === userAId && bSplit) {
      // A paid, B has a split → B owes A → negative for A (A is owed)
      balance -= bSplit.amount
    }
    // If neither paid, or payer's own split: skip (no debt between A and B)
  }

  // From manual adjustments:
  for (const adj of adjustments) {
    if (adj.from_user_id === userAId && adj.to_user_id === userBId) {
      balance += adj.amount  // A owes B more
    }
    if (adj.from_user_id === userBId && adj.to_user_id === userAId) {
      balance -= adj.amount  // B owes A more → A is owed
    }
  }

  // From settlements:
  for (const s of settlements) {
    if (s.payer_id === userAId && s.receiver_id === userBId) {
      balance -= s.amount  // A paid B → reduces what A owes B
    }
    if (s.payer_id === userBId && s.receiver_id === userAId) {
      balance += s.amount  // B paid A → reduces what B owed A
    }
  }

  return balance
}

// Returns each member's NET balance across the entire group
// Positive = they owe (net debtor), Negative = they are owed (net creditor)
export function getGroupNetBalances(
  members: Profile[],
  transactions: Transaction[],
  splits: Split[],
  adjustments: Adjustment[],
  settlements: Settlement[]
): Map<string, number> {

  const balances = new Map<string, number>()
  members.forEach(m => balances.set(m.id, 0))

  for (const txn of transactions) {
    const txnSplits = splits.filter(s => s.transaction_id === txn.id)
    const payerCredit = txnSplits
      .filter((s) => s.user_id !== txn.paid_by)
      .reduce((sum, s) => sum + s.amount, 0)

    // Payer is owed money → negative (good)
    balances.set(txn.paid_by, (balances.get(txn.paid_by) ?? 0) - payerCredit)

    // Non-payer splits → they owe → positive (bad)
    for (const split of txnSplits) {
      if (split.user_id !== txn.paid_by) {
        balances.set(split.user_id, (balances.get(split.user_id) ?? 0) + split.amount)
      }
    }
  }

  for (const adj of adjustments) {
    balances.set(adj.from_user_id, (balances.get(adj.from_user_id) ?? 0) + adj.amount)
    balances.set(adj.to_user_id, (balances.get(adj.to_user_id) ?? 0) - adj.amount)
  }

  for (const s of settlements) {
    balances.set(s.payer_id, (balances.get(s.payer_id) ?? 0) - s.amount)
    balances.set(s.receiver_id, (balances.get(s.receiver_id) ?? 0) + s.amount)
  }

  return balances
}

export function minimizeDebts(balances: Map<string, number>, members: Profile[]): MinimalPayment[] {
  const payments: MinimalPayment[] = []

  // Separate into debtors (owe money, positive) and creditors (owed money, negative)
  const debtors: { id: string; amount: number }[] = []
  const creditors: { id: string; amount: number }[] = []

  for (const [id, amount] of balances) {
    if (amount > 0) debtors.push({ id, amount })       // owes money
    if (amount < 0) creditors.push({ id, amount: -amount })  // is owed money
  }

  // Sort descending by amount
  debtors.sort((a, b) => b.amount - a.amount)
  creditors.sort((a, b) => b.amount - a.amount)

  let d = 0, c = 0
  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d]
    const creditor = creditors[c]
    const settleAmount = Math.min(debtor.amount, creditor.amount)

    const fromName = members.find(m => m.id === debtor.id)?.name || 'Unknown'
    const toName = members.find(m => m.id === creditor.id)?.name || 'Unknown'

    payments.push({ fromId: debtor.id, fromName, toId: creditor.id, toName, amount: settleAmount })

    debtor.amount -= settleAmount
    creditor.amount -= settleAmount

    if (debtor.amount === 0) d++
    if (creditor.amount === 0) c++
  }

  return payments
}

export function getBalanceLabel(amount: number, otherName: string): string {
  if (amount === 0) return `Settled up with ${otherName} ✓`
  if (amount < 0) return `${otherName} owes you ${formatCurrency(Math.abs(amount))}`
  return `You owe ${otherName} ${formatCurrency(amount)}`
}

export function getNetBalanceLabel(amount: number): string {
  if (amount === 0) return 'All settled up ✓'
  if (amount < 0) return `You are owed ${formatCurrency(Math.abs(amount))} overall`
  return `You owe ${formatCurrency(amount)} overall`
}
