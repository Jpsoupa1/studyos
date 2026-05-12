import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value:      number
  max?:       number
  color?:     string
  trackColor?: string
  className?: string
  label?:     boolean
  height?:    number
}

export default function ProgressBar({ value, max = 100, color = '#6366F1', trackColor, className, label, height = 6 }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className={cn('relative', label && 'mt-5', className)}>
      {label && (
        <span className="absolute right-0 -top-5 text-xs font-mono font-bold" style={{ color, fontFamily: 'JetBrains Mono, monospace' }}>
          {pct}%
        </span>
      )}
      <div className="w-full rounded-full overflow-hidden" style={{ background: trackColor ?? '#E2E8F0', height }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
