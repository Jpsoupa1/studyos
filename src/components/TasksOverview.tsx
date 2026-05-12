import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { useTaskStore } from '@/store/taskStore'
import { daysUntil, urgencyColor, taskOccursOn } from '@/types'
import { todayISO, getCategoryColor, isoToDDMMYYYY, formatTimeRange } from '@/lib/utils'

export default function TasksOverview() {
  const { tasks, upcomingTasks } = useTaskStore()
  const today = todayISO()

  const total    = tasks.length
  const done     = tasks.filter((t) => t.done).length
  const overdue  = tasks.filter((t) => !t.done && daysUntil(t.endDate) < 0).length
  const dueToday = tasks.filter((t) => !t.done && taskOccursOn(t, today)).length
  const upcoming = upcomingTasks().slice(0, 5)

  const kpiData = [
    { label: 'Concluídas hoje', value: String(done), total: `/ ${total}`, color: 'var(--green)',  barPct: total ? Math.round((done / total) * 100) : 0 },
    { label: 'Em progresso',    value: String(total - done - overdue), total: `/ ${total}`,  color: 'var(--blue)',   barPct: total ? Math.round(((total - done - overdue) / total) * 100) : 0 },
    { label: 'Atrasadas',       value: String(overdue),                color: 'var(--red)',   barPct: total ? Math.round((overdue / total) * 100) : 0 },
    { label: 'Foco · hoje',     value: String(dueToday),              color: 'var(--amber)', barPct: 0, target: 'prazo hoje' },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* KPI strip — terminal style */}
      <div className="kpis">
        {kpiData.map((k, i) => (
          <motion.div key={k.label} className="kpi"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <div className="kpi-label" style={{ color: k.color }}>
              <span className="dot"></span>{k.label}
            </div>
            <div className="kpi-value">
              <span>{k.value}</span>
              {k.total && <span className="total">{k.total}</span>}
            </div>
            <div className="kpi-bar"><div style={{ width: k.barPct + '%', background: k.color }}></div></div>
            <div className="kpi-meta">
              <span>{k.barPct}%</span>
              <span>{k.target ?? 'meta diária'}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Próximos vencimentos */}
      {upcoming.length > 0 && (
        <div className="tile">
          <div className="tile-head">
            <div className="title-group">
              <Clock size={13} color="var(--amber)" />
              <h3>Próximos prazos</h3>
            </div>
          </div>
          <div className="tasks-list">
            {upcoming.map((task) => {
              const days     = daysUntil(task.endDate)
              const uc       = urgencyColor(days)
              const catColor = getCategoryColor(task.category)

              return (
                <motion.div key={task.id} className="task" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ borderLeft: `3px solid ${catColor}` }}>
                  <div className="task-check" style={{ borderColor: catColor + '50' }} />
                  <div>
                    <div className="task-title">{task.text}</div>
                    <div className="task-meta">
                      <span className="cat" style={{ borderColor: catColor + '40', color: catColor }}>{task.category}</span>
                      <span>{isoToDDMMYYYY(task.endDate)} · {formatTimeRange(task.startTime, task.endTime)}</span>
                    </div>
                  </div>
                  <span className="task-pri" style={{ color: uc, borderColor: uc + '40', background: uc + '10' }}>
                    {days < 0 ? `${-days}d atraso` : days === 0 ? 'hoje' : `${days}d`}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
