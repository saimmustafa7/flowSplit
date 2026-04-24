"use client"
import React, { useEffect, useState, use } from 'react'
import { Group, Transaction, Profile } from '@/data/types'
import { fetchTransactions, deleteTransaction } from '@/data/queries/transactions'
import { fetchGroupMembers } from '@/data/queries/groups'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { SkeletonListItem } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency } from '@/lib/formatters'
import Link from 'next/link'
import { Plus, Receipt, ArrowLeft, Send, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AddTransactionSheet } from '@/components/group/AddTransactionSheet'
import { InviteMemberModal } from '@/components/group/InviteMemberModal'
import { MembersSheet } from '@/components/group/MembersSheet'

function getSplitModeLabel(txn: Transaction): string {
  if (txn.split_mode === 'shares') {
    const amounts = (txn.splits ?? []).map((s) => s.amount).filter((v) => v > 0)
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
    const divisor = amounts.reduce((acc, value) => gcd(acc, value), amounts[0] ?? 1)
    const ratio = amounts.map((amount) => Math.max(1, Math.round(amount / divisor))).join(':')
    return amounts.length ? `Split by shares (${ratio})` : 'Split by shares'
  }
  if (txn.split_mode === 'percentage') {
    const total = txn.total_amount || 1
    const pcts = (txn.splits ?? [])
      .filter((s) => s.amount > 0)
      .map((s) => `${((s.amount / total) * 100).toFixed(0)}%`)
    return pcts.length ? `Split ${pcts.join(' / ')}` : 'Split by percentage'
  }
  if (txn.split_mode === 'mine') return 'Personal expense'
  if (txn.split_mode === 'exact') return 'Exact split'
  return 'Equal split'
}

export default function GroupDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const groupId = unwrappedParams.id

  const [group, setGroup] = useState<Group | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  
  const [isAddingTxn, setIsAddingTxn] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [isMembersOpen, setIsMembersOpen] = useState(false)
  
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    load()
  }, [groupId])

  async function load() {
    try {
      const [txnData, memberData, { data: groupData }] = await Promise.all([
        fetchTransactions(groupId),
        fetchGroupMembers(groupId),
        supabase.from('groups').select('*').eq('id', groupId).single()
      ])
      setTransactions(txnData)
      setMembers(memberData)
      setGroup(groupData as Group)
    } catch (err) {
      showToast('Failed to load group details', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (txnId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return
    try {
      await deleteTransaction(txnId)
      setTransactions(prev => prev.filter(t => t.id !== txnId))
      showToast('Transaction deleted', 'info')
    } catch (err) {
      showToast('Failed to delete', 'error')
    }
  }

  // Live refetch after add
  const onTransactionAdded = () => {
    setIsAddingTxn(false)
    load()
  }

  if (loading) {
     return <div className="p-4"><SkeletonListItem /><SkeletonListItem /></div>
  }

  if (!group) return <div className="p-4">Group not found</div>

  return (
    <div className="px-4 md:px-0 space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link href="/group" className="text-sm text-[var(--text-secondary)] hover:text-accent flex items-center gap-1 font-medium w-fit">
          <ArrowLeft size={16} /> Back to groups
        </Link>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[var(--bg-card)] border border-[var(--border)] rounded-full flex items-center justify-center text-3xl">
              {group.emoji}
            </div>
            <div>
              <h1 className="text-3xl font-bold font-clash">{group.name}</h1>
              <button
                onClick={() => setIsMembersOpen(true)}
                className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-accent transition-colors mt-0.5"
              >
                <Users size={14} />
                {members.length} member{members.length !== 1 ? 's' : ''}
              </button>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Join code: {(group.join_code ?? group.id.slice(0, 8)).toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 sticky top-[64px] z-30 bg-[var(--bg-primary)] py-2 border-b border-[var(--border)]">
         <Button variant="primary" className="flex-1">Expenses</Button>
         <Link href={`/group/${groupId}/ledger`} className="flex-1">
            <Button variant="ghost" className="w-full">Balances</Button>
         </Link>
      </div>

      <div className="flex gap-4 mb-4">
         <Button onClick={() => setIsAddingTxn(true)} className="flex-1 gap-2" disabled={members.length < 2}>
           <Plus size={18} /> Add Bill
         </Button>
         <Button onClick={() => setIsInviting(true)} variant="ghost" className="gap-2 border border-[var(--border)]">
           <Send size={18} /> Invite
         </Button>
      </div>

      {members.length < 2 && (
        <div className="bg-warning/10 text-warning px-4 py-3 rounded-xl border border-warning/20 text-sm">
          Invite members to the group before you can add transactions to split.
        </div>
      )}

      {/* Transactions List */}
      <div className="mt-6">
        {transactions.length === 0 ? (
          <EmptyState 
            icon={Receipt} 
            title="No bills yet" 
            description="When anyone adds a shared expense, it'll show up here."
          />
        ) : (
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
             <AnimatePresence>
               {transactions.map(txn => (
                 <motion.div
                    key={txn.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-between p-4 border-b border-[var(--border)] last:border-0 group"
                 >
                    <div>
                      <h3 className="font-bold text-[var(--text-primary)]">{txn.title}</h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">Paid by {txn.payer?.name} • {getSplitModeLabel(txn)}</p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">
                        {(txn.splits ?? [])
                          .filter((split) => split.amount > 0 && split.user_id !== txn.paid_by)
                          .map((split) => {
                            const memberName = members.find((m) => m.id === split.user_id)?.name ?? 'Member'
                            return `${memberName} ${formatCurrency(split.amount)}`
                          })
                          .join('  ')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-bold font-satoshi text-lg">{formatCurrency(txn.total_amount)}</span>
                      <span className="text-xs text-[var(--text-tertiary)]">{new Date(txn.transaction_date).toLocaleString()}</span>
                      {currentUser?.id === txn.paid_by && (
                        <button onClick={() => handleDelete(txn.id)} className="text-xs text-negative md:opacity-0 group-hover:opacity-100 transition-opacity">
                          Delete
                        </button>
                      )}
                    </div>
                 </motion.div>
               ))}
             </AnimatePresence>
          </div>
        )}
      </div>

      {isAddingTxn && (
      <AddTransactionSheet 
           groupId={groupId}
           groupName={group.name}
           members={members} 
           isOpen={isAddingTxn} 
           onClose={() => setIsAddingTxn(false)} 
           onSuccess={onTransactionAdded} 
         />
      )}

      <InviteMemberModal
        groupId={groupId}
        groupName={group.name}
        isOpen={isInviting}
        onClose={() => setIsInviting(false)}
      />

      {group && currentUser && (
        <MembersSheet
          groupId={groupId}
          groupCreatorId={group.created_by}
          currentUserId={currentUser.id}
          members={members}
          isOpen={isMembersOpen}
          onClose={() => setIsMembersOpen(false)}
          onMemberRemoved={(userId) => {
            setMembers((prev) => prev.filter((m) => m.id !== userId))
          }}
        />
      )}
    </div>
  )
}
