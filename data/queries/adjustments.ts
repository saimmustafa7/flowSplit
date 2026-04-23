import { supabase } from '@/lib/supabase'
import { Adjustment } from '@/data/types'

export async function fetchAdjustments(groupId: string): Promise<Adjustment[]> {
  const { data, error } = await supabase
    .from('adjustments')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Adjustment[]
}

export async function createAdjustment(
  groupId: string,
  fromUserId: string,
  toUserId: string,
  amount: number, // paisa
  note: string
): Promise<Adjustment> {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Not authenticated')

  if (fromUserId === toUserId) throw new Error('Cannot adjust balance with yourself')

  const { data, error } = await supabase
    .from('adjustments')
    .insert({
      group_id: groupId,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      amount,
      note,
      created_by: user.id
    })
    .select()
    .single()

  if (error) throw error
  return data as Adjustment
}
