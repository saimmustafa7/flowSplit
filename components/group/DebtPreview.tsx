"use client"
import React from 'react'
import { Check, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'

export interface DebtPreviewItem {
  debtorName: string
  creditorName: string
  amount: number
  isIncrease: boolean
}

interface DebtPreviewProps {
  amountPaisa: number
  title: string
  items: DebtPreviewItem[]
}

export function DebtPreview({ amountPaisa, title, items }: DebtPreviewProps) {
  return (
    <div className="p-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-input)]">
      <p className="text-xs text-[var(--text-secondary)] mb-2">After this transaction:</p>
      {amountPaisa <= 0 || !title.trim() ? (
        <p className="text-sm text-[var(--text-secondary)]">Fill in amount to see preview</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-[var(--text-primary)] flex items-center gap-1">No debt created <Check size={14} /></p>
      ) : (
        items.map((item) => (
          <div key={`${item.debtorName}-${item.creditorName}`} className="flex items-center justify-between text-sm py-0.5">
            <span>{item.debtorName} owes {item.creditorName}</span>
            <span className={`font-mono flex items-center gap-1 ${item.isIncrease ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
              {formatCurrency(item.amount)} {item.isIncrease ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            </span>
          </div>
        ))
      )}
    </div>
  )
}
