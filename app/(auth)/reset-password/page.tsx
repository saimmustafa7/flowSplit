"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-8">
        <h1 className="text-2xl font-clash mb-2">Set new password</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6">Enter your new password below.</p>
        {error && <p className="text-sm text-negative mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 rounded-[var(--radius-md)] px-4 bg-[var(--bg-input)] border border-[var(--border-subtle)]"
            placeholder="New password"
            required
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full h-12 rounded-[var(--radius-md)] px-4 bg-[var(--bg-input)] border border-[var(--border-subtle)]"
            placeholder="Confirm new password"
            required
          />
          <button disabled={loading} className="w-full h-12 rounded-[var(--radius-md)] bg-[var(--text-primary)] text-[var(--text-inverse)] font-semibold disabled:opacity-50">
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
        <Link href="/login" className="inline-block mt-6 text-sm text-accent">Back to login</Link>
      </div>
    </div>
  )
}
