import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  className = '', 
  children, 
  ...props 
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center min-h-12 rounded-[var(--radius-md)] font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
  
  const variants = {
    primary: "bg-[var(--brand)] text-white hover:brightness-110",
    ghost: "bg-transparent text-[var(--brand)] border border-transparent hover:border-[var(--brand)]/40 hover:bg-[var(--brand-dim)]",
    danger: "bg-transparent text-[var(--negative)] border border-transparent hover:border-[var(--negative)]/40 hover:bg-[var(--negative-dim)]",
    icon: "w-11 h-11 rounded-full bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
  }

  const sizes = {
    sm: "px-3 text-sm",
    md: "px-4 text-sm",
    lg: "px-6 text-base w-full",
    icon: ""
  }

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${variant !== 'icon' ? sizes[size] : ''} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
      ) : (
        children
      )}
    </button>
  )
}
