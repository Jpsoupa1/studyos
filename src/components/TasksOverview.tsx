import { motion } from 'framer-motion'
import { CalendarCheck2, Circle, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import { useTaskStore } from '@/store/taskStore'
import { useUserStore } from '@/store/userStore'
import { daysUntil, taskOccursOn } from '@/types'
import { todayISO, getCategoryColor, formatTimeRange } from '@/lib/utils'

// ─── Donut chart circular ─────────────────────────────────────────────────
function DonutKPI({
  value, total, label, color, icon,
}: {
  value: number; total?: number; label: string; color: string; icon?: React.ReactNode
}) {
  const pct = total ? Math.round((value / total) * 100) : 0
  const size = 72
  const stroke = 6
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <motion.div className="kpi" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 12px' }}>
      <div className="kpi-label" style={{ color, justifyContent: 'center' }}>
        <span className="dot" />{label}
      </div>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeOpacity={0.12} strokeWidth={stroke} />
          {/* Progress */}
          {total ? (
            <circle cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={color} strokeWidth={stroke}
              strokeDasharray={`${circ}`} strokeDashoffset={`${offset}`}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
          ) : null}
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon ?? (
            <>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>
                {value}
              </span>
              {total !== undefined && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)', marginTop: 1 }}>
                  / {total}
                </span>
              )}
            </>
          )}
        </div>
      </div>
      {total !== undefined && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)', letterSpacing: '0.1em' }}>
          {pct}%
        </span>
      )}
    </motion.div>
  )
}

export default function TasksOverview() {
  const { tasks, toggleTask } = useTaskStore()
  const { recordTaskDone }    = useUserStore()
  const today = todayISO()

  const total    = tasks.length
  const done     = tasks.filter((t) => t.done).length
  const inProg   = tasks.filter((t) => !t.done && daysUntil(t.endDate) >= 0).length
  const overdue  = tasks.filter((t) => !t.done && daysUntil(t.endDate) < 0).length
  const dueToday = tasks.filter((t) => !t.done && taskOccursOn(t, today)).length

  // Tarefas de hoje
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
      {/* KPI strip — donut charts */}
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <DonutKPI label="Concluídas hoje" value={done}    total={total}  color="var(--green)" />
        <DonutKPI label="Em progresso"    value={inProg}  total={total}  color="var(--blue)"  />
        <DonutKPI label="Atrasadas"       value={overdue} color="var(--red)"
          icon={
            overdue > 0 ? (
              <div style={{ textAlign: 'center' }}>
                <AlertTriangle size={18} color="var(--red)" />
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--red)', lineHeight: 1, marginTop: 2 }}>
                  {overdue}
                </div>
              </div>
            ) : (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--green)', lineHeight: 1 }}>0</span>
            )
          }
        />
        <DonutKPI label="Foco · hoje" value={dueToday} color="var(--amber)"
          icon={
            <div style={{ textAlign: 'center' }}>
              <Clock size={16} color="var(--amber)" />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--amber)', lineHeight: 1, marginTop: 2 }}>
                {dueToday}
              </div>
            </div>
          }
        />
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
                        <span style={{ color: 'var(--blue)' }}>↻ Recorrente</span>
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
