import { supabase } from '@/lib/supabase'
import { Transaction, SplitMode } from '@/data/types'
import { assertSplitIntegrity } from '@/lib/validators'

export async function fetchTransactions(groupId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      splits (*),
      payer:profiles!transactions_paid_by_fkey(id, name)
    `)
    .eq('group_id', groupId)
    .order('transaction_date', { ascending: false })

  if (error) throw error
  return data as Transaction[]
}

export async function createTransaction(
  groupId: string,
  title: string,
  totalAmount: number,
  paidBy: string,
  category: string,
  transactionDate: string,
  splits: Record<string, number>, // user_id -> amount (paisa)
  splitMode: SplitMode = 'equal',
  note?: string
): Promise<Transaction> {
  assertSplitIntegrity(splits, totalAmount)

  const baseInsert = {
    group_id: groupId,
    title,
    total_amount: totalAmount,
    paid_by: paidBy,
    category,
    transaction_date: transactionDate,
    note
  }

  let txn: Transaction | null = null
  const withMode = await supabase
    .from('transactions')
    .insert({ ...baseInsert, split_mode: splitMode })
    .select()
    .single()

  if (withMode.error) {
    const fallback = await supabase
      .from('transactions')
      .insert(baseInsert)
      .select()
      .single()
    if (fallback.error) throw fallback.error
    txn = fallback.data as Transaction
  } else {
    txn = withMode.data as Transaction
  }

  // 2. Insert splits dynamically (all members who have a share)
  const splitRows = Object.entries(splits)
    .filter((entry) => entry[1] > 0)
    .map(([userId, amount]) => ({
      transaction_id: txn.id,
      user_id: userId,
      amount
    }))

  if (splitRows.length > 0) {
    const { error: splitError } = await supabase.from('splits').insert(splitRows)
    if (splitError) {
      await supabase.from('transactions').delete().eq('id', txn!.id)
      throw splitError
    }
  }

  return txn as Transaction
}

export async function deleteTransaction(txnId: string): Promise<void> {
  // Cascades to splits automatically because of 'on delete cascade' in schema
  const { error } = await supabase.from('transactions').delete().eq('id', txnId)
  if (error) throw error
}
