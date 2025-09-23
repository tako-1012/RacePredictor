'use client'

import { useEffect } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = '確認',
  cancelText = 'キャンセル',
  type = 'info'
}: ConfirmDialogProps) {
  useEffect(() => {
    if (isOpen) {
      const confirmed = window.confirm(`${title}\n\n${message}`)
      if (confirmed) {
        onConfirm()
      } else {
        onCancel()
      }
    }
  }, [isOpen, title, message, onConfirm, onCancel])

  // このコンポーネントは実際には何もレンダリングしません
  // ブラウザの標準confirmダイアログを使用します
  return null
}