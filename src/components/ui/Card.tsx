import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children:  ReactNode
  className?: string
  style?:    CSSProperties
  glow?:     'accent' | 'emerald' | 'none'
  flat?:     boolean
}

export default function Card({ children, className, style, glow = 'none', flat }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border',
        !flat && 'card-shadow',
        glow === 'accent'  && 'accent-glow',
        glow === 'emerald' && 'emerald-glow',
        className,
      )}
      style={{
        background:  'var(--surface)',
        borderColor: 'var(--border)',
        padding:     'var(--card-px)',
        borderRadius: 'var(--card-radius)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
