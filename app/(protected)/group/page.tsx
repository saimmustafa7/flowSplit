"use client"
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useState } from 'react'
import { Group } from '@/data/types'
import { fetchUserGroups, createGroup, joinGroupByCode } from '@/data/queries/groups'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Plus, Users, ArrowRight } from 'lucide-react'
import { validateGroupName, validateEmoji } from '@/lib/validators'
import Link from 'next/link'

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('💰')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState('')

  const { showToast } = useToast()

  const load = useCallback(async () => {
    try {
      const data = await fetchUserGroups()
      setGroups(data)
    } catch {
      showToast('Failed to load groups', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    load()
  }, [load])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    
    try {
      const nameCheck = validateGroupName(name)
      if (!nameCheck.valid) { setFormError(nameCheck.error!); return }
      const emojiCheck = validateEmoji(emoji)
      if (!emojiCheck.valid) { setFormError(emojiCheck.error!); return }

      setFormLoading(true)
      const newGroup = await createGroup(name.trim(), emoji)
      setGroups(prev => [newGroup, ...prev])
      setIsAdding(false)
      setName('')
      setEmoji('💰')
      showToast('Group created successfully', 'success')
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create group')
    } finally {
      setFormLoading(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setJoinError('')
    try {
      setJoinLoading(true)
      const group = await joinGroupByCode(joinCode)
      setGroups((prev) => (prev.some((g) => g.id === group.id) ? prev : [group, ...prev]))
      setIsJoining(false)
      setJoinCode('')
      showToast(`Joined ${group.name}`, 'success')
    } catch (err: unknown) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join group')
    } finally {
      setJoinLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 space-y-4">
        <h1 className="text-3xl font-bold font-clash">Groups</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 md:px-0 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-clash">Groups</h1>
          <p className="text-[var(--text-secondary)]">Split bills with friends</p>
        </div>
        <div className="hidden md:flex gap-2">
        <Button onClick={() => setIsJoining(true)} variant="ghost" className="gap-2 border border-[var(--border)]">
          Join by Code
        </Button>
        <Button onClick={() => setIsAdding(true)} className="gap-2">
          <Plus size={18} /> New Group
        </Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState 
          icon={Users} 
          title="No groups yet" 
          description="Create a group to start splitting bills with friends and family."
          action={<Button onClick={() => setIsAdding(true)}>Create Group</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
             <Link key={group.id} href={`/group/${group.id}`} className="block">
               <Card className="hover:scale-[1.02] transform transition-transform group relative overflow-hidden flex items-center justify-between h-full bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-card)]">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 bg-[var(--bg-primary)] rounded-full flex items-center justify-center text-3xl">
                        {group.emoji}
                     </div>
                     <div>
                        <h2 className="text-lg font-bold font-clash text-[var(--text-primary)]">{group.name}</h2>
                        <p className="text-sm text-[var(--text-secondary)]">Code: {(group.join_code ?? group.id.slice(0, 8)).toUpperCase()}</p>
                     </div>
                  </div>
                  <div className="text-[var(--text-secondary)] group-hover:text-accent transition-colors">
                     <ArrowRight size={20} />
                  </div>
               </Card>
             </Link>
          ))}
        </div>
      )}

      {/* Mobile FAB */}
      <button 
        onClick={() => setIsAdding(true)}
        className="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-accent rounded-full flex items-center justify-center text-white shadow-xl shadow-[var(--accent-glow)] z-30"
      >
        <Plus size={24} />
      </button>

      <button
        onClick={() => setIsJoining(true)}
        className="md:hidden fixed bottom-36 right-6 h-12 px-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full flex items-center justify-center text-[var(--text-primary)] z-30"
      >
        Join
      </button>

      <BottomSheet isOpen={isAdding} onClose={() => setIsAdding(false)} title="Create Group">
        <form onSubmit={handleAdd} className="flex flex-col gap-5">
          {formError && <p className="text-negative text-sm">{formError}</p>}
          
          <div className="flex gap-4">
             <div className="w-20">
               <label className="block text-sm mb-1 text-[var(--text-secondary)]">Emoji</label>
               <input 
                 required
                 value={emoji}
                 onChange={e => setEmoji(e.target.value)}
                 className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-2 py-3 outline-none focus:border-accent text-center text-xl" 
                 maxLength={2}
               />
             </div>
             <div className="flex-1">
               <label className="block text-sm mb-1 text-[var(--text-secondary)]">Group Name</label>
               <input 
                 required
                 value={name}
                 onChange={e => setName(e.target.value)}
                 className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-4 py-3 outline-none focus:border-accent" 
                 placeholder="E.g. Goa Trip"
               />
             </div>
          </div>

          <Button type="submit" isLoading={formLoading} size="lg" className="mt-4">
            Create
          </Button>
        </form>
      </BottomSheet>

      <BottomSheet isOpen={isJoining} onClose={() => setIsJoining(false)} title="Join Group">
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          {joinError && <p className="text-negative text-sm">{joinError}</p>}
          <label className="text-sm text-[var(--text-secondary)]">Group code</label>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-4 py-3 outline-none focus:border-accent uppercase tracking-widest"
            placeholder="AB12CD34"
            required
          />
          <Button type="submit" isLoading={joinLoading} size="lg">Join Group</Button>
        </form>
      </BottomSheet>
    </div>
  )
}
