import { supabase } from '@/lib/supabase'
import { SoloExpense } from '@/data/types'

export async function fetchSoloExpenses(): Promise<SoloExpense[]> {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('solo_expenses')
    .select('*')
    .eq('user_id', user.id)
    .order('expense_date', { ascending: false })

  if (error) throw error
  return data as SoloExpense[]
}

/**
 * Fetch solo expenses for a specific month (YYYY-MM).
 * If no month is given, defaults to current month.
 */
export async function fetchSoloExpensesForMonth(yearMonth?: string): Promise<SoloExpense[]> {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Not authenticated')

  const ym = yearMonth ?? new Date().toISOString().slice(0, 7) // e.g. "2026-05"
  const startDate = `${ym}-01`
  // Last day: go to first of next month then subtract 1 day
  const [year, month] = ym.split('-').map(Number)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const endDate = new Date(nextYear, nextMonth - 1, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('solo_expenses')
    .select('*')
    .eq('user_id', user.id)
    .gte('expense_date', startDate)
    .lte('expense_date', endDate)
    .order('expense_date', { ascending: false })

  if (error) throw error
  return data as SoloExpense[]
}

/**
 * Returns the total (in paisa) spent per month for the current user.
 * Returns array of { yearMonth: "YYYY-MM", total: number } sorted descending.
 */
export async function fetchSoloMonthlyTotals(): Promise<{ yearMonth: string; total: number }[]> {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('solo_expenses')
    .select('expense_date, amount')
    .eq('user_id', user.id)
    .order('expense_date', { ascending: false })

  if (error) throw error

  // Aggregate by month on client side
  const map = new Map<string, number>()
  for (const row of (data as { expense_date: string; amount: number }[])) {
    const ym = row.expense_date.slice(0, 7)
    map.set(ym, (map.get(ym) ?? 0) + row.amount)
  }

  return Array.from(map.entries())
    .map(([yearMonth, total]) => ({ yearMonth, total }))
    .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth))
}

export async function createSoloExpense(
  title: string,
  amount: number,
  category: string,
  expense_date: string,
  note?: string
): Promise<SoloExpense> {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('solo_expenses')
    .insert({
      user_id: user.id,
      title,
      amount,
      category,
      expense_date,
      note
    })
    .select()
    .single()

  if (error) throw error
  return data as SoloExpense
}

export async function deleteSoloExpense(id: string): Promise<void> {
  const { error } = await supabase.from('solo_expenses').delete().eq('id', id)
  if (error) throw error
}
