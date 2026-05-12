import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?:    Size
  children: ReactNode
}

const VARIANTS: Record<Variant, { className: string; style: React.CSSProperties }> = {
  primary:   {
    className: 'font-semibold hover:opacity-90 active:scale-[0.97]',
    style: { background: 'var(--amber)', color: '#0E0E14' },
  },
  secondary: {
    className: 'font-semibold hover:opacity-90 active:scale-[0.97]',
    style: { background: 'var(--card)', color: 'var(--text-1)', border: '1px solid var(--border)' },
  },
  ghost:     {
    className: 'hover:opacity-80 active:scale-[0.97]',
    style: { color: 'var(--text-3)', background: 'transparent' },
  },
  danger:    {
    className: 'font-semibold hover:opacity-90 active:scale-[0.97]',
    style: { background: 'var(--red-soft)', color: 'var(--red)', border: '1px solid var(--red)' },
  },
  outline:   {
    className: 'hover:opacity-90 active:scale-[0.97]',
    style: { background: 'transparent', color: 'var(--text-1)', border: '1px solid var(--border)' },
  },
}

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
}

export default function Button({ variant = 'primary', size = 'md', children, className, style: customStyle, ...props }: ButtonProps) {
  const { className: vcn, style } = VARIANTS[variant]
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none',
        vcn, SIZES[size], className,
      )}
      style={{ ...style, ...customStyle }}
      {...props}
    >
      {children}
    </button>
  )
}
