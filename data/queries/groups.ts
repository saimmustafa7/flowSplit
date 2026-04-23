import { supabase } from '@/lib/supabase'
import { Group, Profile } from '@/data/types'

interface GroupMemberRow {
  group_id: string
  groups: Group | Group[]
}

interface GroupProfileRow {
  profiles: Profile | Profile[]
}

export async function fetchUserGroups(): Promise<Group[]> {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Not authenticated')

  // We fetch groups where the user is a member
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      group_id,
      groups:group_id (
        id, name, emoji, created_by, created_at
      )
    `)
    .eq('user_id', user.id)

  if (error) throw error

  return ((data || []) as unknown as GroupMemberRow[])
    .map((row) => Array.isArray(row.groups) ? row.groups[0] : row.groups)
    .filter((group): group is Group => Boolean(group))
}

export async function createGroup(name: string, emoji: string): Promise<Group> {
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Not authenticated')

  // 1. Create the group
  const groupId = crypto.randomUUID()
  const joinCode = groupId.slice(0, 8).toUpperCase()
  
  const withCode = await supabase
    .from('groups')
    .insert({
      id: groupId,
      name,
      emoji,
      join_code: joinCode,
      created_by: user.id
    })

  if (withCode.error) {
    const fallback = await supabase
      .from('groups')
      .insert({
        id: groupId,
        name,
        emoji,
        created_by: user.id
      })
    if (fallback.error) throw fallback.error
  }

  // 2. Add creator to members
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({
      group_id: groupId,
      user_id: user.id
    })

  if (memberError) {
    // manual rollback if member add fails
    await supabase.from('groups').delete().eq('id', groupId)
    throw memberError
  }

  return {
    id: groupId,
    name,
    emoji,
    join_code: joinCode,
    created_by: user.id,
    created_at: new Date().toISOString()
  } as Group
}

export async function fetchGroupMembers(groupId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      profiles:user_id (id, name, email, created_at)
    `)
    .eq('group_id', groupId)

  if (error) throw error
  return ((data || []) as unknown as GroupProfileRow[])
    .map((row) => Array.isArray(row.profiles) ? row.profiles[0] : row.profiles)
    .filter((profile): profile is Profile => Boolean(profile))
}

export async function joinGroupByCode(rawCode: string): Promise<Group> {
  const code = rawCode.trim().toLowerCase()
  if (!code) throw new Error('Enter a valid group code')
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Not authenticated')

  let group: Group | null = null
  const byJoinCode = await supabase
    .from('groups')
    .select('*')
    .ilike('join_code', code)
    .maybeSingle()

  if (byJoinCode.data) {
    group = byJoinCode.data as Group
  } else {
    const byIdPrefix = await supabase
      .from('groups')
      .select('*')
      .ilike('id', `${code}%`)
      .limit(1)
      .maybeSingle()
    if (byIdPrefix.error) throw byIdPrefix.error
    group = byIdPrefix.data as Group | null
  }

  if (!group) throw new Error('No group found for this code')

  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id })
    if (error) throw error
  }

  return group
}
