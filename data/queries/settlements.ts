import { supabase } from '@/lib/supabase'
import { Settlement } from '@/data/types'

export async function fetchSettlements(groupId: string): Promise<Settlement[]> {
  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Settlement[]
}

export async function createSettlement(
  groupId: string,
  payerId: string,
  receiverId: string,
  amount: number
): Promise<Settlement> {
  if (payerId === receiverId) throw new Error('Cannot settle with yourself')
  
  const { data, error } = await supabase
    .from('settlements')
    .insert({
      group_id: groupId,
      payer_id: payerId,
      receiver_id: receiverId,
      amount
    })
    .select()
    .single()

  if (error) throw error
  return data as Settlement
}
