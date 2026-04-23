"use client"
import React from 'react'
import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  isDanger?: boolean
}

export function ConfirmModal({ 
  isOpen, onClose, onConfirm, title, message, 
  confirmText = "Confirm", cancelText = "Cancel", isLoading = false, isDanger = false 
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-[var(--text-secondary)] mb-8">{message}</p>
      
      <div className="flex gap-4 w-full">
        <Button variant="ghost" className="flex-1" onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button 
          variant={isDanger ? "danger" : "primary"} 
          className="flex-1" 
          onClick={onConfirm} 
          isLoading={isLoading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}
