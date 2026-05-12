import { motion } from 'framer-motion'
import { CalendarCheck2, Circle, CheckCircle2 } from 'lucide-react'
import { useTaskStore } from '@/store/taskStore'
import { useUserStore } from '@/store/userStore'
import { daysUntil, taskOccursOn } from '@/types'
import { todayISO, getCategoryColor, formatTimeRange } from '@/lib/utils'

export default function TasksOverview() {
  const { tasks, toggleTask } = useTaskStore()
  const { recordTaskDone }    = useUserStore()
  const today = todayISO()

  const total    = tasks.length
  const done     = tasks.filter((t) => t.done).length
  const overdue  = tasks.filter((t) => !t.done && daysUntil(t.endDate) < 0).length
  const dueToday = tasks.filter((t) => !t.done && taskOccursOn(t, today)).length

  const kpiData = [
    { label: 'Concluídas hoje', value: String(done),                       total: `/ ${total}`, color: 'var(--green)',  barPct: total ? Math.round((done / total) * 100) : 0 },
    { label: 'Em progresso',    value: String(total - done - overdue),      total: `/ ${total}`, color: 'var(--blue)',   barPct: total ? Math.round(((total - done - overdue) / total) * 100) : 0 },
    { label: 'Atrasadas',       value: String(overdue),                                          color: 'var(--red)',   barPct: total ? Math.round((overdue / total) * 100) : 0 },
    { label: 'Foco · hoje',     value: String(dueToday),                                         color: 'var(--amber)', barPct: 0, target: 'prazo hoje' },
  ]

  // Tarefas de hoje — usa taskOccursOn para incluir recorrentes
  const todayTasks = tasks
    .filter((t) => taskOccursOn(t, today))
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1
      return a.startTime < b.startTime ? -1 : 1
    })

  const handleToggle = async (id: string, wasDone: boolean) => {
    await toggleTask(id)
    if (!wasDone) recordTaskDone()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* KPI strip */}
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

      {/* Tarefas de hoje */}
      <div className="tile">
        <div className="tile-head">
          <div className="title-group">
            <CalendarCheck2 size={14} color="var(--amber)" />
            <h3>Tarefas de hoje</h3>
            <span className="badge">
              {todayTasks.filter((t) => t.done).length}/{todayTasks.length}
            </span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)', letterSpacing: '0.12em' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
          </span>
        </div>

        {todayTasks.length === 0 ? (
          <div className="text-center py-10" style={{ color: 'var(--text-3)' }}>
            <CalendarCheck2 size={28} className="mx-auto mb-3 opacity-20" />
            <p style={{ fontSize: 13 }}>Nenhuma tarefa para hoje</p>
          </div>
        ) : (
          <div className="tasks-list">
            {todayTasks.map((task, i) => {
              const catColor = getCategoryColor(task.category)
              return (
                <motion.div key={task.id} className={`task${task.done ? ' done' : ''}`}
                  layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{ borderLeft: `3px solid ${catColor}` }}
                  onClick={() => void handleToggle(task.id, task.done)}>

                  <div className="task-check" style={{ borderColor: catColor + '60' }}>
                    {task.done
                      ? <CheckCircle2 size={14} color={catColor} />
                      : <Circle size={14} color={catColor + '80'} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="task-title">{task.text}</div>
                    <div className="task-meta">
                      <span className="cat" style={{ borderColor: catColor + '40', color: catColor }}>{task.category}</span>
                      <span>{formatTimeRange(task.startTime, task.endTime)}</span>
                      {task.weekDays.length > 0 && (
                        <span style={{ color: 'var(--blue)' }}>↻ recorrente</span>
                      )}
                    </div>
                  </div>

                  <span className={`task-pri ${task.priority.toLowerCase()}`}>{task.priority}</span>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
