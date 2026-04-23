"use client"
import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export function PasswordInput({ error, className = "", ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false)

  return (
    <div className="flex flex-col gap-1 w-full relative">
      <div className="relative w-full">
        <input
          {...props}
          type={show ? "text" : "password"}
          className={`w-full px-4 py-3 rounded-lg bg-[var(--bg-elevated)] border ${
            error ? 'border-negative' : 'border-[var(--border)] focus:border-accent'
          } outline-none text-[var(--text-primary)] transition-colors pr-12 ${className}`}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      {error && <span className="text-sm text-negative ml-1">{error}</span>}
    </div>
  )
}
