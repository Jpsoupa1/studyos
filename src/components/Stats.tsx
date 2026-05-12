import { motion } from 'framer-motion'
import { useUserStore } from '@/store/userStore'
import { useTaskStore } from '@/store/taskStore'
import { usePomodoroStore } from '@/store/pomodoroStore'
import { todayISO } from '@/lib/utils'

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function last7Days() {
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (6 - i))
    return { label: DAY_LABELS[d.getDay()], date: d.toISOString().split('T')[0], isToday: i === 6 }
  })
}

export default function Stats() {
  const { stats } = useUserStore()
  const { tasks } = useTaskStore()
  const { todayMinutes, cycleCount } = usePomodoroStore()

  const days = last7Days()
  const todayStr = todayISO()

  const getVal = (date: string) => {
    if (date === todayStr) {
      return tasks.filter((t) => t.done && new Date(t.createdAt).toISOString().split('T')[0] === date).length
    }
    const day = stats.weeklyData.find((d) => d.date === date)
    return day ? day.tasksDone + day.habitsCompleted : 0
  }
  const maxVal = Math.max(1, ...days.map((d) => getVal(d.date)))

  const todayDone = tasks.filter(
    (t) => t.done && new Date(t.createdAt).toISOString().split('T')[0] === todayStr
  ).length

  const kpis = [
    { label: 'Tarefas hoje', value: todayDone,    color: 'var(--green)',  icon: '✓' },
    { label: 'Foco (min)',   value: todayMinutes, color: 'var(--amber)',  icon: '⏱' },
    { label: 'Pomodoros',   value: cycleCount,   color: 'var(--red)',    icon: '○' },
    { label: 'XP total',    value: stats.xp,     color: 'var(--purple)', icon: '⚡' },
  ]

  return (
    <div className="tile flex flex-col gap-0">
      <div className="tile-head">
        <div className="title-group">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>▦</span>
          <h3>Estatísticas</h3>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis" style={{ borderRadius: 0, border: 'none', borderBottom: '1px solid var(--line)' }}>
        {kpis.map(({ label, value, color, icon }, i) => (
          <motion.div key={label} className="kpi"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <div className="kpi-label" style={{ color }}>
              <span>{icon}</span> {label}
            </div>
            <div className="kpi-value"><span>{value}</span></div>
            <div className="kpi-bar"><div style={{ width: '100%', background: color }} /></div>
          </motion.div>
        ))}
      </div>

      {/* Gráfico semanal */}
      <div style={{ padding: '14px 18px 18px' }}>
        <div className="kicker" style={{ marginBottom: 12 }}>Últimos 7 dias</div>
        <div className="flex items-end gap-1.5" style={{ height: 72 }}>
          {days.map((day, i) => {
            const val = getVal(day.date)
            const h   = Math.max(4, (val / maxVal) * 56)
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
                <motion.div className="w-full rounded-sm"
                  style={{ background: day.isToday ? 'var(--amber)' : 'var(--line)', height: h }}
                  initial={{ height: 0 }} animate={{ height: h }}
                  transition={{ duration: 0.4, delay: i * 0.04, ease: 'easeOut' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: day.isToday ? 'var(--amber)' : 'var(--text-4)', letterSpacing: '0.08em' }}>
                  {day.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Streak */}
      <div className="streak-strip">
        <div>
          <div className="kicker" style={{ marginBottom: 4 }}>Streak</div>
          <div className="streak-num">{stats.streak}<span className="u">d</span></div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="streak-bars">
            {Array.from({ length: 14 }).map((_, i) => {
              const daysAgo = 13 - i
              const filled  = daysAgo < stats.streak
              return <div key={i} className={`streak-bar${filled ? ' filled' : ''}${filled && daysAgo > 3 ? ' dim' : ''}`} />
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-4)' }}>
            <span>−14d</span><span>HOJE</span>
          </div>
        </div>
      </div>
    </div>
  )
}
