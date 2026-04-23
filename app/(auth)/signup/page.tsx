"use client"
import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { PasswordInput } from '@/components/auth/PasswordInput'
import Link from 'next/link'
import { isValidEmail, validateName, validatePassword } from '@/lib/validators'
import dynamic from 'next/dynamic'

const HeroScene = dynamic(() => import('@/components/three/HeroScene'), { ssr: false })

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validations
    const nameCheck = validateName(name)
    if (!nameCheck.valid) { setError(nameCheck.error!); return }

    if (!isValidEmail(email)) { setError('Please enter a valid email address'); return }

    const passCheck = validatePassword(password)
    if (!passCheck.valid) { setError(passCheck.error!); return }

    if (password !== confirmPassword) { setError('Passwords do not match'); return }

    setLoading(true)
    setError(null)

    // Supabase SignUp
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name.trim()
        }
      }
    })

    if (authError) {
      setLoading(false)
      if (authError.message.includes('already registered')) {
        setError('An account with this email already exists')
      } else {
        setError(authError.message)
      }
      return
    }

    // Since email confirm is off by spec (for dev), we can route directly.
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4 py-8 relative overflow-hidden">
      <HeroScene />
      <div className="w-full max-w-md bg-[var(--bg-card)]/80 backdrop-blur-xl rounded-2xl p-8 border border-[var(--border)] shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2 font-clash">Create Account</h1>
          <p className="text-[var(--text-secondary)] font-satoshi">Start managing expenses together</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[var(--negative)]/10 border border-[var(--negative)]/20 rounded-lg text-negative text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-5 font-satoshi">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Saim Ali"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-accent outline-none text-[var(--text-primary)] transition-colors"
              required
            />
          </div>

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
              placeholder="Min. 8 chars, 1 uppercase, 1 symbol"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Confirm Password</label>
            <PasswordInput
              placeholder="Type password again"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 bg-accent hover:bg-accent/90 text-white rounded-lg font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:transform-none flex items-center justify-center h-14"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-[var(--text-secondary)] font-satoshi">
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:text-accent/80 font-medium transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
