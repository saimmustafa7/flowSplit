"use client"
import React from 'react'
import { Bell, LogOut, ArrowLeft, LayoutDashboard, Users, UserRound, BarChart3, ScanLine } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const desktopNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/group', label: 'Groups', icon: Users },
  { href: '/solo', label: 'Solo', icon: UserRound },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
]

export function Navbar() {
  const { profile, logout } = useAuth()
  
  const pathname = usePathname()
  
  const { pendingCount } = useNotifications()

  const isRootTab = ['/dashboard', '/group', '/solo', '/stats', '/notifications'].includes(pathname)

  return (
    <nav className="sticky top-0 z-40 bg-[var(--bg-card)]/80 backdrop-blur-md border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!isRootTab && (
            <button onClick={() => window.history.back()} className="p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              <ArrowLeft size={20} />
            </button>
          )}
          <Link href="/dashboard" className="text-xl font-bold font-clash text-[var(--text-primary)] flex items-center gap-2 tracking-tight">
            <div className="w-8 h-8 bg-[var(--text-primary)] text-[var(--text-inverse)] rounded flex items-center justify-center">
              <ScanLine size={18} strokeWidth={2.5} />
            </div>
            <span>FLOWSPLIT</span>
          </Link>
        </div>

        {/* Desktop nav links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-1">
          {desktopNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--text-primary)] text-[var(--text-inverse)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-4">
          <Link href="/notifications" className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <Bell size={20} />
            {pendingCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[var(--text-primary)] rounded-full border-2 border-[var(--bg-card)]"></span>
            )}
          </Link>

          <div className="flex items-center gap-3 pl-4 border-l border-[var(--border)]">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-[var(--text-primary)]">{profile?.name || 'User'}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-[var(--text-secondary)] hover:text-negative transition-colors"
              title="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

