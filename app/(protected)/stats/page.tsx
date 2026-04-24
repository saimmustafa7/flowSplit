"use client"
import React, { useEffect, useState, useMemo } from 'react'
import { MonthlyBucket, GroupMonthlyBucket, fetchSoloMonthlyStats, fetchGroupMonthlyStats } from '@/data/queries/stats'
import { Group } from '@/data/types'
import { formatCurrency } from '@/lib/formatters'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { Card } from '@/components/ui/Card'
import { BarChart3, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight, Utensils, Car, Gamepad2, HeartPulse, ShoppingBag, Plane, Zap, Home, Package } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Tab = 'solo' | 'groups' | 'combined'

const CATEGORY_COLORS: Record<string, string> = {
  food: '#FFFFFF',
  transport: '#E4E4E7',
  entertainment: '#D4D4D8',
  health: '#A1A1AA',
  shopping: '#71717A',
  travel: '#52525B',
  utilities: '#3F3F46',
  rent: '#27272A',
  other: '#18181B',
}

const CATEGORY_ICONS: Record<string, any> = {
  food: Utensils, transport: Car, entertainment: Gamepad2, health: HeartPulse,
  shopping: ShoppingBag, travel: Plane, utilities: Zap, rent: Home, other: Package,
}

function CategoryBreakdown({ byCategory, total }: { byCategory: Record<string, number>; total: number }) {
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1])
  if (sorted.length === 0) return <p className="text-sm text-[var(--text-secondary)]">No expenses</p>

  return (
    <div className="space-y-2 mt-3">
      {sorted.map(([cat, amount]) => {
        const pct = total > 0 ? (amount / total) * 100 : 0
        return (
          <div key={cat} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[var(--bg-input)] flex items-center justify-center text-[var(--text-secondary)]">
              {React.createElement(CATEGORY_ICONS[cat] || Package, { size: 16 })}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <span className="capitalize text-sm font-medium text-[var(--text-primary)]">{cat}</span>
                <span className="text-sm font-mono text-[var(--text-secondary)]">{formatCurrency(amount)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--bg-input)] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[cat] || '#6B7280' }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MonthCard({ bucket, label, amountLabel, amount }: {
  bucket: MonthlyBucket | GroupMonthlyBucket
  label: string
  amountLabel: string
  amount: number
}) {
  return (
    <Card className="bg-[var(--bg-surface)] border-[var(--border-strong)]">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">{label}</p>
          <h3 className="text-2xl font-bold font-clash">{formatCurrency(amount)}</h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">{amountLabel} · {bucket.count} expense{bucket.count !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <CategoryBreakdown byCategory={bucket.byCategory} total={amount} />
    </Card>
  )
}

function MonthNavigator({ months, selectedIndex, onSelect }: {
  months: string[]
  selectedIndex: number
  onSelect: (idx: number) => void
}) {
  const label = months[selectedIndex]
  return (
    <div className="flex items-center justify-between bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)] p-2 mb-6">
      <button
        onClick={() => onSelect(Math.min(selectedIndex + 1, months.length - 1))}
        disabled={selectedIndex >= months.length - 1}
        className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors"
      >
        <ChevronLeft size={20} />
      </button>
      <span className="text-sm font-bold font-clash text-[var(--text-primary)]">{label}</span>
      <button
        onClick={() => onSelect(Math.max(selectedIndex - 1, 0))}
        disabled={selectedIndex <= 0}
        className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null
  if (previous === 0) return <span className="text-xs text-[var(--text-secondary)]">New</span>

  const pctChange = ((current - previous) / previous) * 100
  const isUp = pctChange > 0
  const isFlat = Math.abs(pctChange) < 1

  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${isFlat ? 'text-[var(--text-secondary)]' : isUp ? 'text-[var(--negative)]' : 'text-[var(--positive)]'}`}>
      {isFlat ? <Minus size={12} /> : isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {isFlat ? 'Flat' : `${Math.abs(pctChange).toFixed(0)}% ${isUp ? 'more' : 'less'}`}
    </span>
  )
}

export default function StatsPage() {
  const [tab, setTab] = useState<Tab>('combined')
  const [selectedMonth, setSelectedMonth] = useState(0) // 0 = current month
  const [soloBuckets, setSoloBuckets] = useState<MonthlyBucket[]>([])
  const [groupBuckets, setGroupBuckets] = useState<GroupMonthlyBucket[]>([])
  const [perGroup, setPerGroup] = useState<{ group: Group; buckets: GroupMonthlyBucket[] }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [solo, group] = await Promise.all([
          fetchSoloMonthlyStats(6),
          fetchGroupMonthlyStats(6),
        ])
        setSoloBuckets(solo)
        setGroupBuckets(group.combined)
        setPerGroup(group.perGroup)
      } catch (err) {
        console.error('Failed to load stats', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const monthLabels = useMemo(() => soloBuckets.map((b) => b.label), [soloBuckets])

  // Combined = solo + group your-share
  const combinedBuckets = useMemo(() => {
    return soloBuckets.map((soloBucket, i) => {
      const groupBucket = groupBuckets[i]
      const mergedCategories: Record<string, number> = { ...soloBucket.byCategory }
      if (groupBucket) {
        Object.entries(groupBucket.byCategory).forEach(([cat, amt]) => {
          mergedCategories[cat] = (mergedCategories[cat] || 0) + amt
        })
      }
      return {
        month: soloBucket.month,
        label: soloBucket.label,
        total: soloBucket.total + (groupBucket?.yourShare || 0),
        count: soloBucket.count + (groupBucket?.count || 0),
        byCategory: mergedCategories,
        soloTotal: soloBucket.total,
        groupTotal: groupBucket?.yourShare || 0,
      }
    })
  }, [soloBuckets, groupBuckets])

  if (loading) {
    return (
      <div className="px-4 md:px-0 space-y-4">
        <h1 className="text-3xl font-bold font-clash">Stats</h1>
        <SkeletonCard /><SkeletonCard />
      </div>
    )
  }

  const currentSolo = soloBuckets[selectedMonth]
  const previousSolo = soloBuckets[selectedMonth + 1]
  const currentGroup = groupBuckets[selectedMonth]
  const previousGroup = groupBuckets[selectedMonth + 1]
  const currentCombined = combinedBuckets[selectedMonth]
  const previousCombined = combinedBuckets[selectedMonth + 1]

  const tabs: { id: Tab; label: string }[] = [
    { id: 'combined', label: 'All' },
    { id: 'solo', label: 'Solo' },
    { id: 'groups', label: 'Groups' },
  ]

  const slideVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.15 } },
  }

  return (
    <div className="px-4 md:px-0 space-y-6 pb-24 md:pb-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-clash">Monthly Stats</h1>
          <p className="text-[var(--text-secondary)] mt-1">Track your spending trends</p>
        </div>
        <div className="flex items-center gap-1 text-accent">
          <BarChart3 size={20} />
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex bg-[var(--bg-input)] p-1 rounded-full">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 h-10 rounded-full text-sm font-bold transition-all ${
              tab === t.id
                ? 'bg-[var(--text-primary)] text-[var(--text-inverse)] shadow-lg'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Month navigator */}
      {monthLabels.length > 0 && (
        <MonthNavigator
          months={monthLabels}
          selectedIndex={selectedMonth}
          onSelect={setSelectedMonth}
        />
      )}

      <AnimatePresence mode="wait">

        {/* ── Combined ── */}
        {tab === 'combined' && currentCombined && (
          <motion.div key="combined" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-[var(--text-primary)] text-[var(--text-inverse)]">
                <p className="text-xs opacity-70 mb-1">Total Spent</p>
                <p className="text-xl font-bold font-clash">{formatCurrency(currentCombined.total)}</p>
                {previousCombined && <TrendIndicator current={currentCombined.total} previous={previousCombined.total} />}
              </Card>
              <Card className="bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-card)]">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Transactions</p>
                <p className="text-xl font-bold font-clash">{currentCombined.count}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs opacity-60">{currentSolo?.count || 0} solo</span>
                  <span className="text-xs opacity-60">{currentGroup?.count || 0} group</span>
                </div>
              </Card>
            </div>

            {/* Split breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  <span className="text-xs text-[var(--text-secondary)]">Solo</span>
                </div>
                <p className="font-bold font-clash">{formatCurrency(currentCombined.soloTotal)}</p>
              </Card>
              <Card>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-[var(--text-secondary)]" />
                  <span className="text-xs text-[var(--text-secondary)]">Groups (your share)</span>
                </div>
                <p className="font-bold font-clash">{formatCurrency(currentCombined.groupTotal)}</p>
              </Card>
            </div>

            {/* Category breakdown */}
            <Card className="bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-card)]">
              <h3 className="font-bold font-clash mb-1">By Category</h3>
              <CategoryBreakdown byCategory={currentCombined.byCategory} total={currentCombined.total} />
            </Card>
          </motion.div>
        )}

        {/* ── Solo ── */}
        {tab === 'solo' && currentSolo && (
          <motion.div key="solo" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-gradient-to-br from-accent/10 to-[var(--bg-card)]">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Solo Spent</p>
                <p className="text-xl font-bold font-clash">{formatCurrency(currentSolo.total)}</p>
                {previousSolo && <TrendIndicator current={currentSolo.total} previous={previousSolo.total} />}
              </Card>
              <Card className="bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-card)]">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Expenses</p>
                <p className="text-xl font-bold font-clash">{currentSolo.count}</p>
              </Card>
            </div>
            <MonthCard bucket={currentSolo} label={`${currentSolo.label} — Solo`} amountLabel="Total personal" amount={currentSolo.total} />
          </motion.div>
        )}

        {/* ── Groups ── */}
        {tab === 'groups' && currentGroup && (
          <motion.div key="groups" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-gradient-to-br from-[var(--positive-dim)] to-[var(--bg-card)]">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Your Share</p>
                <p className="text-xl font-bold font-clash">{formatCurrency(currentGroup.yourShare)}</p>
                {previousGroup && <TrendIndicator current={currentGroup.yourShare} previous={previousGroup.yourShare} />}
              </Card>
              <Card className="bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-card)]">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Group Total</p>
                <p className="text-xl font-bold font-clash">{formatCurrency(currentGroup.total)}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">{currentGroup.count} bills</p>
              </Card>
            </div>

            {/* Per-group breakdown */}
            {perGroup.map(({ group, buckets }) => {
              const bucket = buckets[selectedMonth]
              if (!bucket || bucket.yourShare === 0) return null
              return (
                <Card key={group.id} className="bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-card)]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-xl">
                      {group.emoji}
                    </div>
                    <div>
                      <h3 className="font-bold font-clash text-sm">{group.name}</h3>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Your share: {formatCurrency(bucket.yourShare)} / {formatCurrency(bucket.total)}
                      </p>
                    </div>
                  </div>
                  <CategoryBreakdown byCategory={bucket.byCategory} total={bucket.yourShare} />
                </Card>
              )
            })}

            {perGroup.every(({ buckets }) => !buckets[selectedMonth] || buckets[selectedMonth].yourShare === 0) && (
              <Card>
                <p className="text-sm text-[var(--text-secondary)] text-center py-4">No group expenses this month</p>
              </Card>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
