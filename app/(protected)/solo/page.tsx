"use client"
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useState } from 'react'
import { SoloExpense } from '@/data/types'
import { fetchSoloExpenses, createSoloExpense, deleteSoloExpense } from '@/data/queries/soloExpenses'
import { formatCurrency, parseToPaisa } from '@/lib/formatters'
import { validateSoloExpense } from '@/lib/validators'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { SkeletonListItem } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Plus, Wallet, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
// Note Recharts import would go here for Category Chart if fully built out

export default function SoloPage() {
  const [expenses, setExpenses] = useState<SoloExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  
  // Form State
  const [title, setTitle] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [category, setCategory] = useState('other')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null)
  
  const { showToast } = useToast()

  const load = useCallback(async () => {
    try {
      const data = await fetchSoloExpenses()
      setExpenses(data)
    } catch {
      showToast('Failed to load expenses', 'error')
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
      const amountPaisa = parseToPaisa(amountInput)
      const valid = validateSoloExpense(amountPaisa, title, category, date)
      if (!valid.valid) {
        setFormError(valid.error!)
        return
      }

      setFormLoading(true)
      const newExp = await createSoloExpense(title.trim(), amountPaisa, category, date)
      setExpenses(prev => [newExp, ...prev])
      setIsAdding(false)
      setTitle('')
      setAmountInput('')
      showToast('Expense added successfully', 'success')
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Validation failed')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteSoloExpense(deleteId)
      setExpenses(prev => prev.filter(e => e.id !== deleteId))
      showToast('Expense deleted', 'info')
    } catch {
      showToast('Failed to delete', 'error')
    } finally {
      setDeleteId(null)
    }
  }

  if (loading) {
    return (
      <div className="px-4 space-y-4">
        <SkeletonListItem />
        <SkeletonListItem />
      </div>
    )
  }

  return (
    <div className="px-4 md:px-0 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-clash">Solo Tracker</h1>
          <p className="text-[var(--text-secondary)]">Manage personal expenses</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="flex gap-2">
          <Plus size={18} /> Add
        </Button>
      </div>

      {expenses.length === 0 ? (
        <EmptyState 
          icon={Wallet} 
          title="No solo expenses yet" 
          description="Track your personal spending privately."
          action={<Button onClick={() => setIsAdding(true)}>Add your first expense</Button>}
        />
      ) : (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <AnimatePresence>
            {expenses.map((expense) => (
              <motion.div
                key={expense.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between p-4 border-b border-[var(--border)] last:border-0 group"
              >
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">{expense.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="capitalize">{expense.category}</span>
                    <span>•</span>
                    <span>{new Date(expense.expense_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold font-clash">{formatCurrency(expense.amount)}</span>
                  <button 
                    onClick={() => setDeleteId(expense.id)}
                    className="p-2 text-[var(--text-secondary)] hover:text-negative md:opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}



      <BottomSheet isOpen={isAdding} onClose={() => setIsAdding(false)} title="Add Expense">
        <form onSubmit={handleAdd} className="flex flex-col gap-5">
          {formError && <p className="text-negative text-sm">{formError}</p>}
          
          <div>
            <label className="block text-sm mb-1 text-[var(--text-secondary)]">Title</label>
            <input 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-4 py-3 outline-none focus:border-accent" 
              placeholder="E.g. Groceries"
            />
          </div>

          <div>
             <label className="block text-sm mb-1 text-[var(--text-secondary)]">Amount</label>
             <input 
               required
               inputMode="decimal"
               value={amountInput}
               onChange={e => setAmountInput(e.target.value)}
               className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-4 py-3 outline-none focus:border-accent font-mono text-lg" 
               placeholder="0.00"
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 text-[var(--text-secondary)]">Category</label>
              <select 
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-4 py-3 outline-none focus:border-accent capitalize"
              >
                {['food','transport','entertainment','health','shopping','travel','utilities','rent','other'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1 text-[var(--text-secondary)]">Date</label>
              <input 
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-4 py-3 outline-none focus:border-accent"
              />
            </div>
          </div>

          <Button type="submit" isLoading={formLoading} size="lg" className="mt-4">
            Save Expense
          </Button>
        </form>
      </BottomSheet>

      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={handleDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
        isDanger
      />
    </div>
  )
}
