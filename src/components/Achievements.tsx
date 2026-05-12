import { motion } from 'framer-motion'
import { useUserStore } from '@/store/userStore'
import { getLevelName, getLevelProgress } from '@/types'
import ProgressBar from './ui/ProgressBar'

const LEVEL_COLORS: Record<string, string> = {
  Calouro:     'var(--blue)',
  Veterano:    'var(--amber)',
  Mestre:      'var(--purple)',
  'AXIS Elite': 'var(--red)',
}

const KPI_CONFIG = [
  { label: 'Tarefas',   key: 'totalTasksDone',   color: 'var(--green)'  },
  { label: 'Pomodoros', key: 'totalPomodoros',    color: 'var(--amber)'  },
  { label: 'Horas',     key: 'totalStudyMinutes', color: 'var(--purple)' },
] as const

export default function Achievements() {
  const { stats, achievements } = useUserStore()
  const level      = getLevelName(stats.xp)
  const { current, max } = getLevelProgress(stats.xp)
  const levelColor = LEVEL_COLORS[level] ?? 'var(--accent)'

  return (
    <div className="tile flex flex-col">
      <div className="tile-head">
        <div className="title-group">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber)' }}>★</span>
          <h3>Conquistas</h3>
          <span className="badge" style={{ color: levelColor, borderColor: levelColor + '50' }}>{level}</span>
        </div>
      </div>

      {/* XP progress */}
      <div style={{ padding: '14px 18px' }}>
        <div className="flex justify-between mb-2">
          <span className="kicker">XP</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: levelColor }}>{stats.xp} / {max}</span>
        </div>
        <ProgressBar value={current} max={max} color={levelColor} />
      </div>

      {/* Stats */}
      <div className="kpis" style={{ borderRadius: 0, border: 'none', borderTop: '1px solid var(--line)', gridTemplateColumns: 'repeat(3,1fr)' }}>
        {KPI_CONFIG.map(({ label, key, color }) => {
          const rawValue = stats[key as keyof typeof stats] as number
          const value    = key === 'totalStudyMinutes' ? Math.round(rawValue / 60) : rawValue
          return (
            <div key={label} className="kpi">
              <div className="kpi-label" style={{ color }}>{label}</div>
              <div className="kpi-value"><span>{value}</span></div>
            </div>
          )
        })}
      </div>

      {/* Conquistas */}
      <div className="flex flex-col overflow-y-auto" style={{ maxHeight: 'min(240px, 38vh)' }}>
        {achievements.map((ach, i) => (
          <motion.div key={ach.id}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
            className="reminder"
            style={{ opacity: ach.unlockedAt ? 1 : 0.35 }}>
            <span style={{ fontSize: 18 }}>{ach.icon}</span>
            <div>
              <div className="txt" style={{ color: ach.unlockedAt ? 'var(--amber)' : 'var(--text-1)' }}>{ach.title}</div>
              <div className="when">{ach.description}</div>
            </div>
            {ach.unlockedAt
              ? <span className="pill" style={{ color: 'var(--amber)', borderColor: 'var(--amber-line)' }}>✓ OK</span>
              : <span className="pill">Bloq.</span>
            }
          </motion.div>
        ))}
      </div>
    </div>
  )
}
