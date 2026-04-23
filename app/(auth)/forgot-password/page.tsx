"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { isValidEmail } from '@/lib/validators'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!isValidEmail(email)) {
      setError('Please enter a valid email')
      return
    }
    setLoading(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (resetError) {
      setError(resetError.message)
    } else {
      setMessage('Password reset link sent. Please check your email.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-8">
        <h1 className="text-2xl font-clash mb-2">Forgot password</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6">Enter your account email to receive a reset link.</p>
        {error && <p className="text-sm text-negative mb-3">{error}</p>}
        {message && <p className="text-sm text-positive mb-3">{message}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 rounded-[var(--radius-md)] px-4 bg-[var(--bg-input)] border border-[var(--border-subtle)]"
            placeholder="you@example.com"
            required
          />
          <button disabled={loading} className="w-full h-12 rounded-[var(--radius-md)] bg-[var(--brand)] text-white font-semibold disabled:opacity-50">
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
        <Link href="/login" className="inline-block mt-6 text-sm text-accent">Back to login</Link>
      </div>
    </div>
  )
}
