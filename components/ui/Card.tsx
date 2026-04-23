import React from 'react'

export function Card({ children, className = '', onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-2xl ${onClick ? 'cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
