import React from 'react'

export function Badge({ variant = 'neutral', children }: { variant?: 'positive' | 'negative' | 'neutral', children: React.ReactNode }) {
  const styles = {
    positive: 'bg-positive/10 text-positive border-positive/20',
    negative: 'bg-negative/10 text-negative border-negative/20',
    neutral: 'bg-accent/10 text-accent border-accent/20'
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]}`}>
      {children}
    </span>
  )
}
