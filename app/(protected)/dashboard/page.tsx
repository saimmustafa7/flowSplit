"use client"
import React, { useEffect, useState } from 'react'
import { fetchUserGroups } from '@/data/queries/groups'
import { fetchSoloExpenses } from '@/data/queries/soloExpenses'
import { Group, SoloExpense } from '@/data/types'
import { Card } from '@/components/ui/Card'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { formatCurrency } from '@/lib/formatters'
import Link from 'next/link'
import { ArrowRight, Wallet, Users } from 'lucide-react'

export default function DashboardPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [recentSolo, setRecentSolo] = useState<SoloExpense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [gData, sData] = await Promise.all([
          fetchUserGroups(),
          fetchSoloExpenses()
        ])
        setGroups(gData.slice(0, 3))
        setRecentSolo(sData.slice(0, 3))
      } catch (err) {
        console.error('Failed to load dashboard', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalSoloThisMonth = recentSolo.reduce((acc, curr) => acc + curr.amount, 0) // naive calc for demo

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold font-clash px-4 md:px-0">Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 md:px-0">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="px-4 md:px-0 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-clash">Dashboard</h1>
          <p className="text-[var(--text-secondary)] mt-1">Your financial overview</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 md:px-0">
        <Link href="/solo" className="block">
          <Card className="hover:scale-[1.02] transform transition-transform group relative overflow-hidden bg-[var(--bg-surface)] border-[var(--border-strong)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[var(--text-primary)] rounded-lg text-[var(--text-inverse)]">
                <Wallet size={24} />
              </div>
              <h2 className="text-lg font-bold font-clash">Recent Solo</h2>
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">
               <AnimatedNumber value={totalSoloThisMonth} format={(v) => formatCurrency(v)} />
            </div>
            <p className="text-[var(--text-secondary)] text-sm mt-1">spent recently</p>
            <div className="absolute right-4 bottom-4 text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight />
            </div>
          </Card>
        </Link>

        <Link href="/group" className="block">
          <Card className="hover:scale-[1.02] transform transition-transform group relative overflow-hidden bg-[var(--bg-surface)] border-[var(--border-strong)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)]">
                <Users size={24} />
              </div>
              <h2 className="text-lg font-bold font-clash">Active Groups</h2>
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">
               <AnimatedNumber value={groups.length} />
            </div>
            <p className="text-[var(--text-secondary)] text-sm mt-1">groups joined</p>
            <div className="absolute right-4 bottom-4 text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight />
            </div>
          </Card>
        </Link>
      </div>

      <div className="px-4 md:px-0">
         <h2 className="text-xl font-bold font-clash mb-4 px-2">Quick Actions</h2>
         <div className="grid grid-cols-2 gap-3">
            <Link href="/solo" className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[var(--bg-elevated)] transition-colors text-sm font-medium">
               <span>+</span> Add Expense
            </Link>
            <Link href="/group" className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[var(--bg-elevated)] transition-colors text-sm font-medium">
               <span>+</span> New Group
            </Link>
         </div>
      </div>
    </div>
  )
}
