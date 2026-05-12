import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, ChevronDown, ChevronRight, CheckCircle2, Circle, CalendarCheck, Pencil } from 'lucide-react'
import { useTaskStore } from '@/store/taskStore'
import { useUserStore } from '@/store/userStore'
import {
  getCategoryColor,
  formatTimeRange, isoToDDMMYYYY, cn,
} from '@/lib/utils'
import { daysUntil, urgencyColor, taskOccursOn, type Task, type TaskCategory } from '@/types'
import { getToken, deleteCalendarEvent } from '@/services/google'
import ProgressBar from './ui/ProgressBar'
import Button from './ui/Button'
import TaskForm from './TaskForm'

export default function TaskList() {
  const {
    tasks, filter, toggleTask, deleteTask, addSubtask, toggleSubtask,
    loadFromDB, todayProgress, setFilter,
  } = useTaskStore()
  const { recordTaskDone } = useUserStore()

  const [expanded,    setExpanded]    = useState<string | null>(null)
  const [subInput,    setSubInput]    = useState('')
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  useEffect(() => { void loadFromDB() }, [])

  const handleToggle = async (id: string, wasDone: boolean) => {
    await toggleTask(id)
    if (!wasDone) recordTaskDone()
  }

  const handleDelete = async (id: string, calendarEventId?: string) => {
    const token = getToken()
    if (token && calendarEventId) deleteCalendarEvent(token, calendarEventId).catch(() => {})
    await deleteTask(id)
  }

  const today = new Date().toISOString().split('T')[0]

  const filtered = tasks.filter((t) => {
    if (filter.category !== 'all' && t.category !== filter.category) return false
    if (filter.priority !== 'all' && t.priority !== filter.priority) return false
    if (filter.status === 'pending' && t.done)  return false
    if (filter.status === 'done'    && !t.done) return false
    if (filter.period === 'today' && !taskOccursOn(t, today)) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    if (a.endDate !== b.endDate) return a.endDate < b.endDate ? -1 : 1
    return a.startTime < b.startTime ? -1 : 1
  })

  const CATS: (TaskCategory | 'all')[] = ['all', 'Estudos', 'Exercício', 'Pessoal', 'Trabalho']

  return (
    <div className="tile">
      {/* Header */}
      <div className="tile-head">
        <div className="title-group">
          <CheckCircle2 size={14} color="var(--green)" />
          <h3>Tarefas</h3>
          <span className="badge">{tasks.filter((t) => !t.done).length} pendentes · {tasks.filter((t) => t.done).length} ok</span>
        </div>
        <div className="ctrl">
          {/* Filtros rápidos */}
          <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none', maxWidth: 220 }}>
            {CATS.map((c) => (
              <button key={c}
                onClick={() => setFilter({ category: c as TaskCategory | 'all' })}
                className="badge"
                style={{
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  color:        filter.category === c ? 'var(--amber)' : 'var(--text-3)',
                  borderColor:  filter.category === c ? 'var(--amber-line)' : 'var(--line)',
                  background:   filter.category === c ? 'var(--amber-soft)' : 'transparent',
                }}>
                {c === 'all' ? 'Todas' : c}
              </button>
            ))}
            <button onClick={() => setFilter({ period: filter.period === 'today' ? 'all' : 'today' })}
              className="badge"
              style={{
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                color: filter.period === 'today' ? 'var(--blue)' : 'var(--text-3)',
                borderColor: filter.period === 'today' ? 'var(--blue)' : 'var(--line)',
                background: filter.period === 'today' ? 'var(--blue-soft)' : 'transparent',
              }}>Hoje</button>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ padding: '10px 18px 0' }}>
        <ProgressBar value={todayProgress()} label color="var(--amber)" />
      </div>

      {/* Lista */}
      <div className="tasks-list" style={{ maxHeight: 'min(440px, 55vh)', overflowY: 'auto' }}>
        <AnimatePresence initial={false}>
          {sorted.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-10" style={{ color: 'var(--text-3)' }}>
              <CalendarCheck size={26} className="mx-auto mb-2 opacity-25" />
              <p style={{ fontSize: 13 }}>Nenhuma tarefa {filter.period === 'today' ? 'para hoje' : 'encontrada'}</p>
            </motion.div>
          )}
          {sorted.map((task) => {
            const days     = daysUntil(task.endDate)
            const uc       = urgencyColor(days)
            const catColor = getCategoryColor(task.category)

            return (
              <motion.div key={task.id} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -16 }}>
                <div className={`task${task.done ? ' done' : ''}`} onClick={() => void handleToggle(task.id, task.done)}>
                  <div className="task-check" style={{ borderColor: catColor + '60' }}>
                    {task.done && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0E0E14" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="task-title">{task.text}</div>
                    <div className="task-meta">
                      <span className="cat" style={{ borderColor: catColor + '40', color: catColor }}>{task.category}</span>
                      <span>
                        {isoToDDMMYYYY(task.startDate)}
                        {task.startDate !== task.endDate && ` → ${isoToDDMMYYYY(task.endDate)}`}
                        {' · '}{formatTimeRange(task.startTime, task.endTime)}
                      </span>
                      {!task.done && (
                        <span style={{ color: uc }}>
                          {days < 0 ? `⚠ ${-days}d atraso` : days === 0 ? '· hoje' : `${days}d`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
                    <span className={`task-pri ${task.priority.toLowerCase()}`}>{task.priority}</span>
                    <button className="icon-btn" onClick={() => setExpanded(expanded === task.id ? null : task.id)}>
                      {expanded === task.id ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                    </button>
                    <button className="icon-btn" onClick={() => setEditingTask(task)}
                      style={{ color: 'var(--amber)' }}>
                      <Pencil size={11} />
                    </button>
                    <button className="icon-btn" onClick={() => void handleDelete(task.id, task.calendarEventId)}
                      style={{ color: 'var(--red)' }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                {/* Subtarefas */}
                <AnimatePresence>
                  {expanded === task.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="overflow-hidden" style={{ borderBottom: '1px solid var(--line-soft)' }}>
                      <div className="flex flex-col gap-1.5 px-14 py-3" style={{ background: 'var(--bg-2)' }}>
                        {task.subtasks.map((sub) => (
                          <div key={sub.id} className="flex items-center gap-2">
                            <button onClick={() => void toggleSubtask(task.id, sub.id)}>
                              {sub.done
                                ? <CheckCircle2 size={13} color="var(--green)" />
                                : <Circle size={13} color="var(--text-3)" />}
                            </button>
                            <span className={cn('', sub.done && 'line-through opacity-50')}
                              style={{ fontSize: 12, color: 'var(--text-2)' }}>{sub.text}</span>
                          </div>
                        ))}
                        <div className="flex gap-2 mt-1">
                          <input value={subInput} onChange={(e) => setSubInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { void addSubtask(task.id, subInput); setSubInput('') } }}
                            placeholder="Nova subtarefa..."
                            className="flex-1 rounded-lg px-2 py-1.5 text-xs outline-none"
                            style={{ background: 'var(--bg)', color: 'var(--text-1)', border: '1px solid var(--line)', fontFamily: 'var(--font-body)' }} />
                          <Button size="sm" variant="secondary" onClick={() => { void addSubtask(task.id, subInput); setSubInput('') }}>+</Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <TaskForm
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask ?? undefined}
      />
    </div>
  )
}
