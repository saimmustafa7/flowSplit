import React from 'react'
import { LucideIcon } from 'lucide-react'

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action 
}: { 
  icon: LucideIcon, 
  title: string, 
  description: string, 
  action?: React.ReactNode 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--bg-elevated)]/30">
      <div className="w-16 h-16 bg-[var(--bg-card)] rounded-full flex items-center justify-center text-accent mb-6 shadow-xl shadow-[var(--accent-glow)]">
        <Icon size={32} />
      </div>
      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 font-clash">{title}</h3>
      <p className="text-[var(--text-secondary)] max-w-sm mb-8">
        {description}
      </p>
      {action}
    </div>
  )
}
