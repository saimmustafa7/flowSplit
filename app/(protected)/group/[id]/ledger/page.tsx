"use client"
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useState, use } from 'react'
import { Group, Profile, MinimalPayment } from '@/data/types'
import { fetchTransactions } from '@/data/queries/transactions'
import { fetchGroupMembers } from '@/data/queries/groups'
import { fetchAdjustments } from '@/data/queries/adjustments'
import { fetchSettlements } from '@/data/queries/settlements'
import { getGroupNetBalances, getRawBalanceBetween, getNetBalanceLabel } from '@/lib/ledger'
import { formatCurrency } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { SkeletonListItem } from '@/components/ui/Skeleton'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, HandCoins } from 'lucide-react'
import { SettleUpModal } from '@/components/group/SettleUpModal'

export default function LedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const groupId = unwrappedParams.id

  const { user } = useAuth()
  const { showToast } = useToast()

  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Profile[]>([])
  const [netBalances, setNetBalances] = useState<Map<string, number>>(new Map())
  const [payments, setPayments] = useState<MinimalPayment[]>([])
  const [loading, setLoading] = useState(true)

  const [settleData, setSettleData] = useState<{toId: string, toName: string, amount: number} | null>(null)

  const load = useCallback(async () => {
    try {
      const [{ data: groupData }, mData, tData, aData, sData] = await Promise.all([
        supabase.from('groups').select('*').eq('id', groupId).single(),
        fetchGroupMembers(groupId),
        fetchTransactions(groupId),
        fetchAdjustments(groupId),
        fetchSettlements(groupId)
      ])

      setGroup(groupData as Group)
      setMembers(mData)

      const allSplits = tData.flatMap((t) => t.splits || [])

      // Overall net balance for the "Your balance" header card
      const richBalances = getGroupNetBalances(mData, tData, allSplits, aData, sData)
      setNetBalances(richBalances)

      // Pairwise bilateral balances — no cross-person debt merging.
      // For every unique pair (i, j), calculate what i owes j directly.
      const pairPayments: MinimalPayment[] = []
      for (let i = 0; i < mData.length; i++) {
        for (let j = i + 1; j < mData.length; j++) {
          const a = mData[i]
          const b = mData[j]
          // Positive → a owes b, Negative → b owes a
          const balance = getRawBalanceBetween(tData, allSplits, aData, sData, a.id, b.id)
          if (balance > 1) {
            pairPayments.push({ fromId: a.id, fromName: a.name, toId: b.id, toName: b.name, amount: balance })
          } else if (balance < -1) {
            pairPayments.push({ fromId: b.id, fromName: b.name, toId: a.id, toName: a.name, amount: -balance })
          }
        }
      }
      setPayments(pairPayments)

    } catch {
      showToast('Failed to load ledger', 'error')
    } finally {
      setLoading(false)
    }
  }, [groupId, showToast])

  useEffect(() => {
    load()
  }, [load])
  const currentUserId = user?.id


  const onSettleComplete = () => {
    setSettleData(null)
    load()
  }

  if (loading) return <div className="p-4"><SkeletonListItem /><SkeletonListItem /></div>
  if (!group) return <div className="p-4">Group not found</div>

  return (
    <div className="px-4 md:px-0 space-y-6 pb-24 md:pb-8">
      <div className="flex flex-col gap-4">
        <Link href={`/group/${groupId}`} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 font-medium w-fit transition-colors">
          <ArrowLeft size={16} /> Back to transactions
        </Link>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[var(--bg-card)] border border-[var(--border)] rounded-full flex items-center justify-center text-3xl">
              {group.emoji}
            </div>
            <div>
              <h1 className="text-3xl font-bold font-clash">Ledger</h1>
              <p className="text-[var(--text-secondary)]">Who owes whom</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 sticky top-[64px] z-30 bg-[var(--bg-primary)] py-2 border-b border-[var(--border)]">
         <Link href={`/group/${groupId}`} className="flex-1">
            <Button variant="ghost" className="w-full">Expenses</Button>
         </Link>
         <Button variant="primary" className="flex-1 bg-[var(--text-primary)] text-[var(--text-inverse)]">Balances</Button>
      </div>

      <div className="space-y-6">
        {/* Your Overall Balance */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] p-6 rounded-2xl">
           <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Your net balance in {group.name}</h2>
           <div className="text-2xl font-bold font-clash">
              {currentUserId && netBalances.has(currentUserId) ? getNetBalanceLabel(netBalances.get(currentUserId) ?? 0) : 'All settled up ✓'}
           </div>
        </div>

        {/* Pairwise Debts */}
        <div>
           <h3 className="text-lg font-bold font-clash mb-3 text-[var(--text-primary)]">Outstanding Balances</h3>
           {payments.length === 0 ? (
             <div className="text-center py-10 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
               <HandCoins className="mx-auto text-[var(--text-secondary)] mb-2" size={32} />
               <p className="text-[var(--text-secondary)]">All balanced out. Nobody owes anything!</p>
             </div>
           ) : (
             <div className="space-y-3">
               {payments.map((pay, i) => {
                const isUserPayer = pay.fromId === currentUserId
                const isUserReceiver = pay.toId === currentUserId
                 
                 return (
                   <div key={i} className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl flex items-center justify-between">
                     <div className="flex items-center gap-2 flex-1">
                       <Avatar name={pay.fromName} size="sm" />
                       <ArrowRight size={14} className="text-[var(--text-secondary)]" />
                       <Avatar name={pay.toName} size="sm" />
                       <div className="ml-2 text-sm">
                         <span className={isUserPayer ? 'font-bold text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}>{isUserPayer ? 'You' : pay.fromName}</span>
                         {' owe '}
                         <span className={isUserReceiver ? 'font-bold text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}>{isUserReceiver ? 'you' : pay.toName}</span>
                       </div>
                     </div>
                     <div className="flex flex-col items-end gap-2">
                       <span className="font-bold font-mono bg-[var(--bg-elevated)] px-2 py-1 rounded text-sm">
                         {formatCurrency(pay.amount)}
                       </span>
                       {isUserPayer && (
                         <Button size="sm" onClick={() => setSettleData({toId: pay.toId, toName: pay.toName, amount: pay.amount})}>
                           Settle Up
                         </Button>
                       )}
                     </div>
                   </div>
                 )
               })}
             </div>
           )}
        </div>
      </div>

      {settleData && (
        <SettleUpModal 
          groupId={groupId} 
          toId={settleData.toId} 
          toName={settleData.toName} 
          maxAmount={settleData.amount} 
          isOpen={!!settleData} 
          onClose={() => setSettleData(null)} 
          onSuccess={onSettleComplete} 
        />
      )}
    </div>
  )
}


export default function LedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const groupId = unwrappedParams.id

  const { user } = useAuth()
  const { showToast } = useToast()

  const [group, setGroup] = useState<Group | null>(null)
  const [netBalances, setNetBalances] = useState<Map<string, number>>(new Map())
  const [payments, setPayments] = useState<MinimalPayment[]>([])
  const [loading, setLoading] = useState(true)

  const [settleData, setSettleData] = useState<{toId: string, toName: string, amount: number} | null>(null)

  const load = useCallback(async () => {
    try {
      const [{ data: groupData }, mData, tData, aData, sData] = await Promise.all([
        supabase.from('groups').select('*').eq('id', groupId).single(),
        fetchGroupMembers(groupId),
        fetchTransactions(groupId),
        fetchAdjustments(groupId),
        fetchSettlements(groupId)
      ])

      setGroup(groupData as Group)
      
      // We need splits populated for accurate transaction debts
      const allSplits = tData.flatMap((t) => t.splits || [])
      const richBalances = getGroupNetBalances(mData, tData, allSplits, aData, sData)

      setNetBalances(richBalances)
      setPayments(minimizeDebts(richBalances, mData))

    } catch {
      showToast('Failed to load ledger', 'error')
    } finally {
      setLoading(false)
    }
  }, [groupId, showToast])

  useEffect(() => {
    load()
  }, [load])
  const currentUserId = user?.id


  const onSettleComplete = () => {
    setSettleData(null)
    load()
  }

  if (loading) return <div className="p-4"><SkeletonListItem /><SkeletonListItem /></div>
  if (!group) return <div className="p-4">Group not found</div>

  return (
    <div className="px-4 md:px-0 space-y-6 pb-24 md:pb-8">
      <div className="flex flex-col gap-4">
        <Link href={`/group/${groupId}`} className="text-sm text-[var(--text-secondary)] hover:text-accent flex items-center gap-1 font-medium w-fit">
          <ArrowLeft size={16} /> Back to transactions
        </Link>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[var(--bg-card)] border border-[var(--border)] rounded-full flex items-center justify-center text-3xl">
              {group.emoji}
            </div>
            <div>
              <h1 className="text-3xl font-bold font-clash">Ledger</h1>
              <p className="text-[var(--text-secondary)]">Who owes whom</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 sticky top-[64px] z-30 bg-[var(--bg-primary)] py-2 border-b border-[var(--border)]">
         <Link href={`/group/${groupId}`} className="flex-1">
            <Button variant="ghost" className="w-full">Expenses</Button>
         </Link>
         <Button variant="primary" className="flex-1">Balances</Button>
      </div>

      <div className="space-y-6">
        {/* Your Overall Balance */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] p-6 rounded-2xl">
           <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Your net balance in {group.name}</h2>
           <div className="text-2xl font-bold font-clash">
              {currentUserId && netBalances.has(currentUserId) ? getNetBalanceLabel(netBalances.get(currentUserId) ?? 0) : 'All settled up ✓'}
           </div>
        </div>

        {/* Minimal Debts view */}
        <div>
           <h3 className="text-lg font-bold font-clash mb-3 text-[var(--text-primary)]">Suggested Payments</h3>
           {payments.length === 0 ? (
             <div className="text-center py-10 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
               <HandCoins className="mx-auto text-accent mb-2" size={32} />
               <p className="text-[var(--text-secondary)]">All balanced out. Nobody owes anything!</p>
             </div>
           ) : (
             <div className="space-y-3">
               {payments.map((pay, i) => {
                const isUserPayer = pay.fromId === currentUserId
                const isUserReceiver = pay.toId === currentUserId
                 
                 return (
                   <div key={i} className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl flex items-center justify-between">
                     <div className="flex items-center gap-2 flex-1">
                       <Avatar name={pay.fromName} size="sm" />
                       <ArrowRight size={14} className="text-[var(--text-secondary)]" />
                       <Avatar name={pay.toName} size="sm" />
                       <div className="ml-2 text-sm">
                         <span className={isUserPayer ? 'font-bold text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}>{isUserPayer ? 'You' : pay.fromName}</span>
                         {' owe '}
                         <span className={isUserReceiver ? 'font-bold text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}>{isUserReceiver ? 'You' : pay.toName}</span>
                       </div>
                     </div>
                     <div className="flex flex-col items-end gap-2">
                       <span className="font-bold font-mono bg-[var(--bg-elevated)] px-2 py-1 rounded text-sm">
                         {formatCurrency(pay.amount)}
                       </span>
                       {isUserPayer && (
                         <Button size="sm" onClick={() => setSettleData({toId: pay.toId, toName: pay.toName, amount: pay.amount})}>
                           Settle Up
                         </Button>
                       )}
                     </div>
                   </div>
                 )
               })}
             </div>
           )}
        </div>
      </div>

      {settleData && (
        <SettleUpModal 
          groupId={groupId} 
          toId={settleData.toId} 
          toName={settleData.toName} 
          maxAmount={settleData.amount} 
          isOpen={!!settleData} 
          onClose={() => setSettleData(null)} 
          onSuccess={onSettleComplete} 
        />
      )}
    </div>
  )
}
