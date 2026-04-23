"use client"
import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const [maxHeight, setMaxHeight] = React.useState<number>(700)

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  useEffect(() => {
    const updateHeight = () => {
      const vh = window.visualViewport?.height ?? window.innerHeight
      setMaxHeight(vh - 60)
    }
    updateHeight()
    window.visualViewport?.addEventListener('resize', updateHeight)
    window.addEventListener('resize', updateHeight)
    return () => {
      window.visualViewport?.removeEventListener('resize', updateHeight)
      window.removeEventListener('resize', updateHeight)
    }
  }, [])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0, transition: { type: 'spring', stiffness: 400, damping: 40 } }}
            exit={{ y: '100%', transition: { duration: 0.2 } }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.y > 150 || velocity.y > 500) onClose()
            }}
            className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-50 bg-[var(--bg-elevated)] border-t border-[var(--border-default)] rounded-t-[var(--radius-xl)] md:rounded-[var(--radius-xl)] shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight }}
          >
            <div className="w-full flex justify-center py-3 bg-[var(--bg-elevated)]">
              <div className="w-9 h-1 bg-[var(--border-strong)] rounded-full" />
            </div>
            
            <div className="px-6 pb-2 border-b border-[var(--border-subtle)] flex items-center justify-between sticky top-0 bg-[var(--bg-elevated)] z-10">
              <h2 className="text-xl font-bold font-clash">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                 <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
