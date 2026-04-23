"use client"
import React from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Navbar } from '@/components/layout/Navbar'
import { BottomNav } from '@/components/layout/BottomNav'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-satoshi">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto md:px-4 py-4 md:py-8 pb-24 md:pb-8">
          {children}
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  )
}
