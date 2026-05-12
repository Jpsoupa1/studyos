import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  children:  ReactNode
  color?:    string
  bg?:       string
  className?: string
}

export default function Badge({ children, color = '#6366F1', bg, className }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', className)}
      style={{ background: bg ?? `${color}18`, color }}
    >
      {children}
    </span>
  )
}
