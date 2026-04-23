import { supabase } from '@/lib/supabase'
import { GroupInvite } from '@/data/types'
import { fetchProfileByEmail } from './profiles'

// Fetch invites that the current user has received
export async function fetchPendingInvites(): Promise<GroupInvite[]> {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('group_invites')
    .select(`
      *,
      group:group_id (id, name, emoji),
      inviter:invited_by (name, email)
    `)
    .eq('invited_user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as GroupInvite[]
}

// Accept invite wrapper with manual transactional fallback
export async function acceptInvite(inviteId: string, groupId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Not authenticated')

  try {
    // 1. Update invite status to accepted
    const { error: updateError } = await supabase
      .from('group_invites')
      .update({ status: 'accepted' })
      .eq('id', inviteId)
      .eq('invited_user_id', user.id)
    
    if (updateError) throw updateError

    // 2. Add to group_members
    const { error: joinError } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: user.id })

    if (joinError) throw joinError

  } catch (err) {
    // Rollback
    await supabase.from('group_invites').update({ status: 'pending' }).eq('id', inviteId)
    throw err
  }
}

export async function declineInvite(inviteId: string): Promise<void> {
  const { error } = await supabase
    .from('group_invites')
    .update({ status: 'declined' })
    .eq('id', inviteId)

  if (error) throw error
}

export async function sendInvite(groupId: string, emailToInvite: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Not authenticated')

  if (emailToInvite.toLowerCase() === user.email?.toLowerCase()) {
    throw new Error('You cannot invite yourself')
  }

  const targetUser = await fetchProfileByEmail(emailToInvite)
  if (!targetUser) throw new Error('No FlowSplit account found. They need to sign up first.')

  // Check if member already
  const { data: existingMember } = await supabase
    .from('group_members')
    .select('id').eq('group_id', groupId).eq('user_id', targetUser.id).single()
  
  if (existingMember) throw new Error(`${targetUser.name} is already in this group`)

  // Check if pending invite
  const { data: existingInvite } = await supabase
    .from('group_invites')
    .select('id, status').eq('group_id', groupId).eq('invited_user_id', targetUser.id).single()
  
  if (existingInvite?.status === 'pending') {
    throw new Error(`Invite already sent to ${targetUser.name}. Waiting for them to accept.`)
  }

  // Upsert
  const { error } = await supabase.from('group_invites').upsert({
    group_id: groupId,
    invited_by: user.id,
    invited_user_id: targetUser.id,
    status: 'pending'
  }, { onConflict: 'group_id,invited_user_id' })

  if (error) throw error
}
