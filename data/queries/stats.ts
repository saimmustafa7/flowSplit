import { supabase } from '@/lib/supabase'
import { SoloExpense, Transaction, Group, Split } from '@/data/types'

export interface MonthlyBucket {
  /** ISO month string, e.g. "2026-04" */
  month: string
  label: string // e.g. "Apr 2026"
  total: number // paisa
  byCategory: Record<string, number> // category -> paisa
  count: number
}

export interface GroupMonthlyBucket extends MonthlyBucket {
  yourShare: number // paisa — only your split share
}

/** Returns the ISO month string for a date, e.g. "2026-04" */
function toMonth(dateStr: string): string {
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function monthLabel(monthStr: string): string {
  const [year, m] = monthStr.split('-')
  const date = new Date(Number(year), Number(m) - 1)
  return date.toLocaleString('default', { month: 'short', year: 'numeric' })
}

/**
 * Get the last N months (including current) as ISO month strings, newest first
 */
function getLastNMonths(n: number): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(toMonth(d.toISOString()))
  }
  return months
}

/**
 * Solo monthly stats — groups solo expenses by month + category
 */
export async function fetchSoloMonthlyStats(monthCount = 6): Promise<MonthlyBucket[]> {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Not authenticated')

  const months = getLastNMonths(monthCount)
  const startDate = `${months[months.length - 1]}-01`

  const { data, error } = await supabase
    .from('solo_expenses')
    .select('*')
    .eq('user_id', user.id)
    .gte('expense_date', startDate)
    .order('expense_date', { ascending: false })

  if (error) throw error
  const expenses = (data || []) as SoloExpense[]

  // Bucket by month
  const bucketMap: Record<string, MonthlyBucket> = {}
  months.forEach((m) => {
    bucketMap[m] = { month: m, label: monthLabel(m), total: 0, byCategory: {}, count: 0 }
  })

  expenses.forEach((exp) => {
    const m = toMonth(exp.expense_date)
    if (!bucketMap[m]) return
    bucketMap[m].total += exp.amount
    bucketMap[m].count += 1
    bucketMap[m].byCategory[exp.category] = (bucketMap[m].byCategory[exp.category] || 0) + exp.amount
  })

  return months.map((m) => bucketMap[m])
}

/**
 * Group monthly stats — groups transactions by month, calculates your share
 */
export async function fetchGroupMonthlyStats(monthCount = 6): Promise<{
  combined: GroupMonthlyBucket[]
  perGroup: { group: Group; buckets: GroupMonthlyBucket[] }[]
}> {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Not authenticated')

  const months = getLastNMonths(monthCount)
  const startDate = `${months[months.length - 1]}-01`

  // Get all groups user is in
  const { data: memberRows, error: memberErr } = await supabase
    .from('group_members')
    .select('group_id, groups:group_id (id, name, emoji, created_by, created_at)')
    .eq('user_id', user.id)

  if (memberErr) throw memberErr

  const groups: Group[] = ((memberRows || []) as Array<{ group_id: string; groups: Group | Group[] }>)
    .map((r) => (Array.isArray(r.groups) ? r.groups[0] : r.groups))
    .filter((g): g is Group => Boolean(g))

  if (groups.length === 0) {
    const emptyBuckets = months.map((m) => ({
      month: m, label: monthLabel(m), total: 0, yourShare: 0, byCategory: {}, count: 0
    }))
    return { combined: emptyBuckets, perGroup: [] }
  }

  const groupIds = groups.map((g) => g.id)

  // Fetch all transactions + splits for user's groups in the date range
  const { data: txnData, error: txnErr } = await supabase
    .from('transactions')
    .select('*, splits(*)')
    .in('group_id', groupIds)
    .gte('transaction_date', startDate)
    .order('transaction_date', { ascending: false })

  if (txnErr) throw txnErr
  const transactions = (txnData || []) as Transaction[]

  // Combined buckets
  const combinedMap: Record<string, GroupMonthlyBucket> = {}
  months.forEach((m) => {
    combinedMap[m] = { month: m, label: monthLabel(m), total: 0, yourShare: 0, byCategory: {}, count: 0 }
  })

  // Per-group buckets
  const perGroupMap: Record<string, Record<string, GroupMonthlyBucket>> = {}
  groupIds.forEach((gid) => {
    perGroupMap[gid] = {}
    months.forEach((m) => {
      perGroupMap[gid][m] = { month: m, label: monthLabel(m), total: 0, yourShare: 0, byCategory: {}, count: 0 }
    })
  })

  transactions.forEach((txn) => {
    const m = toMonth(txn.transaction_date)
    if (!combinedMap[m]) return

    const splits = (txn.splits || []) as Split[]
    const myShare = splits.find((s) => s.user_id === user.id)?.amount || 0

    // Combined
    combinedMap[m].total += txn.total_amount
    combinedMap[m].yourShare += myShare
    combinedMap[m].count += 1
    combinedMap[m].byCategory[txn.category] = (combinedMap[m].byCategory[txn.category] || 0) + myShare

    // Per-group
    const gid = txn.group_id
    if (perGroupMap[gid]?.[m]) {
      perGroupMap[gid][m].total += txn.total_amount
      perGroupMap[gid][m].yourShare += myShare
      perGroupMap[gid][m].count += 1
      perGroupMap[gid][m].byCategory[txn.category] = (perGroupMap[gid][m].byCategory[txn.category] || 0) + myShare
    }
  })

  return {
    combined: months.map((m) => combinedMap[m]),
    perGroup: groups.map((group) => ({
      group,
      buckets: months.map((m) => perGroupMap[group.id][m]),
    })),
  }
}
