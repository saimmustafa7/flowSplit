import React from 'react'

export function Avatar({ name, size = 'md', className = '' }: { name: string, size?: 'sm'|'md'|'lg', className?: string }) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'

  const colors = [
    '#7C6BFF', '#22C55E', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#14B8A6'
  ]
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
  const bgColor = colors[colorIndex]

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold shrink-0 ${sizes[size]} ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      {initials}
    </div>
  )
}
