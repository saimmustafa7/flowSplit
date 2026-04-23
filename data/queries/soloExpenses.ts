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
