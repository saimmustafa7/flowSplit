"use client"
import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { PasswordInput } from '@/components/auth/PasswordInput'
import Link from 'next/link'
import { isValidEmail } from '@/lib/validators'
import dynamic from 'next/dynamic'

const HeroScene = dynamic(() => import('@/components/three/HeroScene'), { ssr: false })

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Quick validation
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.')
      return
    }
    if (!password) {
      setError('Password is required.')
      return
    }

    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setLoading(false)
      // Hide specifics as requested
      if (authError.message.includes('Invalid login')) {
         setError('Invalid email or password')
      } else {
         setError('Something went wrong. Please try again.')
      }
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4 relative overflow-hidden">
      <HeroScene />
      <div className="w-full max-w-md bg-[var(--bg-card)]/80 backdrop-blur-xl rounded-2xl p-8 border border-[var(--border)] shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2 font-clash">Welcome back</h1>
          <p className="text-[var(--text-secondary)] font-satoshi">Log in to your FlowSplit account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[var(--negative)]/10 border border-[var(--negative)]/20 rounded-lg text-negative text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-6 font-satoshi">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-accent outline-none text-[var(--text-primary)] transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Password</label>
            <PasswordInput
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="mt-2 text-right">
              <Link href="/forgot-password" className="text-sm text-accent hover:text-accent/80">
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 bg-[var(--text-primary)] hover:opacity-90 text-[var(--text-inverse)] rounded-lg font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:transform-none flex items-center justify-center h-14"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-[var(--text-inverse)] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-[var(--text-secondary)] font-satoshi">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-accent hover:text-accent/80 font-medium transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
