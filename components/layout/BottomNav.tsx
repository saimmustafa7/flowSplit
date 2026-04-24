"use client"
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, UserRound, Bell, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNotifications } from '@/context/NotificationContext'

export function BottomNav() {
  const pathname = usePathname()
  const { pendingCount } = useNotifications()

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/group', label: 'Groups', icon: Users },
    { href: '/solo', label: 'Solo', icon: UserRound },
    { href: '/stats', label: 'Stats', icon: BarChart3 },
    { href: '/notifications', label: 'Alerts', icon: Bell },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-base)]/92 backdrop-blur-[20px] border-t border-[var(--border-subtle)] pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)

          return (
            <motion.div whileTap={{ scale: 0.96 }} key={item.href} className="w-full h-full">
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? 'text-[var(--brand)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {isActive && <span className="w-1 h-1 rounded-full bg-[var(--brand)]" />}
              <div className="relative">
                <Icon size={22} />
                {item.href === '/notifications' && pendingCount > 0 && (
                  <span className={`absolute -top-1 -right-2 rounded-full bg-[var(--negative)] text-white ${pendingCount > 9 ? 'px-1 h-4 min-w-5 text-[8px] flex items-center justify-center' : 'w-2 h-2'}`}>
                    {pendingCount > 9 ? '9+' : ''}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
            </motion.div>
          )
        })}
      </div>
    </nav>
  )
}
