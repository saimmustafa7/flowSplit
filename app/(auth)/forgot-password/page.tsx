"use client"
import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { isValidEmail, validatePassword } from '@/lib/validators'
import { Mail, KeyRound, Lock, CheckCircle2, ArrowLeft } from 'lucide-react'

type Step = 'email' | 'otp' | 'password' | 'done'

const OTP_LENGTH = 8

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // ── Step 1: send OTP ────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!isValidEmail(email)) { setError('Please enter a valid email'); return }
    setLoading(true)
    // No redirectTo → Supabase sends a 6-character OTP code instead of a magic link
    const { error: err } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)
    if (err) { setError(err.message); return }
    setStep('otp')
  }

  // ── Step 2: verify OTP ──────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const token = otp.join('')
    if (token.length < OTP_LENGTH) { setError('Enter the full 8-character code'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' })
    setLoading(false)
    if (err) { setError('Invalid or expired code. Please try again.'); return }
    setStep('password')
  }

  // ── Step 3: set new password ────────────────────────────────────────────
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const check = validatePassword(password)
    if (!check.valid) { setError(check.error!); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setStep('done')
  }

  // ── OTP box key handler ─────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const char = value.replace(/\s/g, '').slice(-1).toUpperCase()
    const next = [...otp]
    next[index] = char
    setOtp(next)
    if (char && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\s/g, '').toUpperCase().slice(0, OTP_LENGTH)
    const next = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((char, i) => { next[i] = char })
    setOtp(next)
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1)
    otpRefs.current[focusIdx]?.focus()
    e.preventDefault()
  }

  const stepVariants = {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, x: -24, transition: { duration: 0.2 } },
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-8 overflow-hidden">

        {/* Progress dots */}
        {step !== 'done' && (
          <div className="flex gap-2 mb-8">
            {(['email', 'otp', 'password'] as Step[]).map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  ['email', 'otp', 'password'].indexOf(step) >= i
                    ? 'bg-[var(--brand)]'
                    : 'bg-[var(--border-subtle)]'
                }`}
              />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── Step 1: Email ── */}
          {step === 'email' && (
            <motion.div key="email" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[var(--brand-dim)] flex items-center justify-center">
                  <Mail size={20} className="text-[var(--brand)]" />
                </div>
                <h1 className="text-2xl font-clash">Forgot password</h1>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Enter your email and we'll send a verification code.
              </p>
              {error && <p className="text-sm text-negative mb-4 bg-negative/10 px-3 py-2 rounded-lg">{error}</p>}
              <form onSubmit={handleSendOtp} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 rounded-[var(--radius-md)] px-4 bg-[var(--bg-input)] border border-[var(--border-subtle)] outline-none focus:border-[var(--brand)]"
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
                <button
                  disabled={loading}
                  className="w-full h-12 rounded-[var(--radius-md)] bg-[var(--brand)] text-white font-semibold disabled:opacity-50 transition-opacity"
                >
                  {loading ? 'Sending code...' : 'Send verification code'}
                </button>
              </form>
              <Link href="/login" className="inline-flex items-center gap-1 mt-6 text-sm text-[var(--text-secondary)] hover:text-accent transition-colors">
                <ArrowLeft size={14} /> Back to login
              </Link>
            </motion.div>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 'otp' && (
            <motion.div key="otp" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[var(--brand-dim)] flex items-center justify-center">
                  <KeyRound size={20} className="text-[var(--brand)]" />
                </div>
                <h1 className="text-2xl font-clash">Enter code</h1>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                We sent a 8-character code to <span className="text-[var(--text-primary)] font-medium">{email}</span>. Check your inbox (and spam folder).
              </p>
              {error && <p className="text-sm text-negative mb-4 bg-negative/10 px-3 py-2 rounded-lg">{error}</p>}
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {/* OTP boxes */}
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((char, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el }}
                      type="text"
                      inputMode="text"
                      maxLength={1}
                      value={char}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`w-11 h-14 rounded-[var(--radius-md)] text-center text-xl font-bold font-mono bg-[var(--bg-input)] border transition-colors outline-none uppercase
                        ${char ? 'border-[var(--brand)] text-[var(--brand)]' : 'border-[var(--border-subtle)] text-[var(--text-primary)]'}
                        focus:border-[var(--brand)]`}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
                <button
                  disabled={loading || otp.join('').length < OTP_LENGTH}
                  className="w-full h-12 rounded-[var(--radius-md)] bg-[var(--brand)] text-white font-semibold disabled:opacity-50 transition-opacity"
                >
                  {loading ? 'Verifying...' : 'Verify code'}
                </button>
              </form>
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => { setStep('email'); setOtp(Array(OTP_LENGTH).fill('')); setError(null) }}
                  className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-accent transition-colors"
                >
                  <ArrowLeft size={14} /> Change email
                </button>
                <button
                  onClick={handleSendOtp}
                  className="text-sm text-accent hover:underline"
                >
                  Resend code
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: New Password ── */}
          {step === 'password' && (
            <motion.div key="password" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[var(--brand-dim)] flex items-center justify-center">
                  <Lock size={20} className="text-[var(--brand)]" />
                </div>
                <h1 className="text-2xl font-clash">New password</h1>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Choose a strong password for your account.
              </p>
              {error && <p className="text-sm text-negative mb-4 bg-negative/10 px-3 py-2 rounded-lg">{error}</p>}
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 rounded-[var(--radius-md)] px-4 bg-[var(--bg-input)] border border-[var(--border-subtle)] outline-none focus:border-[var(--brand)]"
                  placeholder="New password"
                  required
                  autoFocus
                />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full h-12 rounded-[var(--radius-md)] px-4 bg-[var(--bg-input)] border border-[var(--border-subtle)] outline-none focus:border-[var(--brand)]"
                  placeholder="Confirm new password"
                  required
                />
                <p className="text-xs text-[var(--text-secondary)]">
                  Min. 8 chars · 1 uppercase · 1 number · 1 special character
                </p>
                <button
                  disabled={loading}
                  className="w-full h-12 rounded-[var(--radius-md)] bg-[var(--brand)] text-white font-semibold disabled:opacity-50 transition-opacity"
                >
                  {loading ? 'Updating...' : 'Update password'}
                </button>
              </form>
            </motion.div>
          )}

          {/* ── Done ── */}
          {step === 'done' && (
            <motion.div key="done" variants={stepVariants} initial="initial" animate="animate" exit="exit"
              className="flex flex-col items-center text-center py-6 gap-4">
              <div className="w-16 h-16 rounded-full bg-positive/15 flex items-center justify-center">
                <CheckCircle2 size={36} className="text-positive" />
              </div>
              <h1 className="text-2xl font-clash">Password updated!</h1>
              <p className="text-sm text-[var(--text-secondary)]">Your password has been changed successfully.</p>
              <Link
                href="/login"
                className="mt-2 w-full h-12 rounded-[var(--radius-md)] bg-[var(--brand)] text-white font-semibold flex items-center justify-center"
              >
                Back to login
              </Link>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

