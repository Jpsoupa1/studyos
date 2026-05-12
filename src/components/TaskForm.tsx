import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Tag, Flag, CalendarPlus, Calendar } from 'lucide-react'
import { useTaskStore, type AddTaskOptions } from '@/store/taskStore'
import { getToken, createCalendarEvent, deleteCalendarEvent } from '@/services/google'
import {
  getCategoryColor, getCategoryBg, getPriorityColor,
  isoToDDMMYYYY, ddmmyyyyToISO, isValidDDMMYYYY, todayISO,
} from '@/lib/utils'
import { WEEKDAY_LABELS, type Task, type TaskCategory, type TaskPriority, type WeekdayIndex } from '@/types'
import Button from './ui/Button'

const CATEGORIES: TaskCategory[] = ['Estudos', 'Exercício', 'Pessoal', 'Trabalho']
const PRIORITIES: TaskPriority[]  = ['Alta', 'Média', 'Baixa']

interface TaskFormProps {
  isOpen:        boolean
  onClose:       () => void
  defaultStart?: string
  task?:         Task   // se fornecido, entra em modo edição
}

export default function TaskForm({ isOpen, onClose, defaultStart, task }: TaskFormProps) {
  const { addTask, updateTask, updateCalendarEventId } = useTaskStore()
  const isEditing = !!task

  const [text,      setText]      = useState('')
  const [cat,       setCat]       = useState<TaskCategory>('Estudos')
  const [prio,      setPrio]      = useState<TaskPriority>('Média')
  const [startDate, setStartDate] = useState('')
  const [endDate,   setEndDate]   = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime,   setEndTime]   = useState('10:00')
  const [weekDays,  setWeekDays]  = useState<WeekdayIndex[]>([])
  const [loading,   setLoading]   = useState(false)
  const [syncCal,   setSyncCal]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    if (task) {
      // Modo edição: pré-preenche com os dados da tarefa
      setText(task.text)
      setCat(task.category)
      setPrio(task.priority)
      setStartDate(isoToDDMMYYYY(task.startDate))
      setEndDate(isoToDDMMYYYY(task.endDate))
      setStartTime(task.startTime)
      setEndTime(task.endTime)
      setWeekDays(task.weekDays)
    } else {
      const today = isoToDDMMYYYY(todayISO())
      setStartDate(today)
      setEndDate(today)
      setStartTime(defaultStart ?? '09:00')
      setEndTime('10:00')
      setWeekDays([])
      setText('')
      setCat('Estudos')
      setPrio('Média')
    }
    setError(null)
  }, [isOpen, defaultStart, task])

  const toggleWeekDay = (dow: WeekdayIndex) =>
    setWeekDays((prev) =>
      prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow]
    )

  const handleSubmit = async () => {
    if (!text.trim())                { setError('Informe o título da tarefa.'); return }
    if (!isValidDDMMYYYY(startDate)) { setError('Data de início inválida (dd/MM/yyyy).'); return }
    if (!isValidDDMMYYYY(endDate))   { setError('Data de término inválida (dd/MM/yyyy).'); return }
    const startISO = ddmmyyyyToISO(startDate)
    const endISO   = ddmmyyyyToISO(endDate)
    if (endISO < startISO)           { setError('A data de término deve ser ≥ início.'); return }
    if (!startTime || !endTime)      { setError('Informe os horários.'); return }
    if (endTime <= startTime)        { setError('O horário de término deve ser após o início.'); return }

    setLoading(true); setError(null)
    try {
      const opts: AddTaskOptions = {
        text: text.trim(), category: cat, priority: prio,
        startDate: startISO, endDate: endISO,
        startTime, endTime, weekDays,
      }

      if (isEditing && task) {
        await updateTask(task.id, opts)
        // Reagenda evento no Calendar se existir
        if (syncCal) {
          const token = getToken()
          if (token && task.calendarEventId) {
            deleteCalendarEvent(token, task.calendarEventId).catch(() => {})
            createCalendarEvent(token, { ...task, ...opts })
              .then((id) => updateCalendarEventId(task.id, id))
              .catch((e) => console.warn('[Study OS] Calendar update:', e))
          }
        }
      } else {
        const created = await addTask(opts)
        if (syncCal) {
          const token = getToken()
          if (token) {
            createCalendarEvent(token, created)
              .then((id) => updateCalendarEventId(created.id, id))
              .catch((e) => console.warn('[Study OS] Calendar sync:', e))
          }
        }
      }
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : isEditing ? 'Erro ao salvar tarefa.' : 'Erro ao criar tarefa.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Estilos compartilhados ─────────────────────────────────────────────
  const inputBase: React.CSSProperties = {
    width: '100%', background: 'var(--bg-2)', color: 'var(--text-1)',
    border: '1px solid var(--line)', borderRadius: 8,
    padding: '9px 12px', fontSize: 13, outline: 'none',
    fontFamily: 'var(--font-body)', transition: 'border-color 0.12s',
  }
  const focusAmber = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = 'var(--amber)')
  const blurLine   = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = 'var(--line)')

  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9,
    letterSpacing: '0.16em', textTransform: 'uppercase',
    color: 'var(--text-4)', marginBottom: 5,
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 glass-overlay"
          onClick={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full sm:max-w-lg flex flex-col"
            style={{
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: '14px 14px 0 0', maxHeight: '95vh',
            }}
          >
            {/* Header */}
            <div className="tile-head flex-shrink-0" style={{ borderRadius: 0 }}>
              <div className="title-group">
                <CalendarPlus size={14} color="var(--amber)" />
                <h3>{isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
              </div>
              <button className="icon-btn" onClick={onClose}><X size={13} /></button>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-4 overflow-y-auto flex-1" style={{ padding: '1.25rem' }}>

              {/* Título */}
              <div>
                <label style={labelStyle}>Título *</label>
                <input value={text} onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit() }}
                  placeholder="Ex: Estudar grafos — cap. 4" autoFocus
                  style={inputBase} onFocus={focusAmber} onBlur={blurLine} />
              </div>

              {/* Período */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={12} color="var(--text-4)" />
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Período *</label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p style={{ ...labelStyle, marginBottom: 4 }}>Início (dd/MM/yyyy)</p>
                    <input value={startDate} onChange={(e) => setStartDate(e.target.value)}
                      placeholder="07/05/2026" maxLength={10} style={{ ...inputBase, fontFamily: 'var(--font-mono)' }}
                      onFocus={focusAmber} onBlur={blurLine} />
                  </div>
                  <div>
                    <p style={{ ...labelStyle, marginBottom: 4 }}>Término (dd/MM/yyyy)</p>
                    <input value={endDate} onChange={(e) => setEndDate(e.target.value)}
                      placeholder="07/05/2026" maxLength={10} style={{ ...inputBase, fontFamily: 'var(--font-mono)' }}
                      onFocus={focusAmber} onBlur={blurLine} />
                  </div>
                </div>
              </div>

              {/* Horários */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={12} color="var(--text-4)" />
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Horário *</label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p style={{ ...labelStyle, marginBottom: 4 }}>Início</p>
                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                      style={{ ...inputBase, colorScheme: 'dark' }} onFocus={focusAmber} onBlur={blurLine} />
                  </div>
                  <div>
                    <p style={{ ...labelStyle, marginBottom: 4 }}>Término</p>
                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                      style={{ ...inputBase, colorScheme: 'dark' }} onFocus={focusAmber} onBlur={blurLine} />
                  </div>
                </div>
              </div>

              {/* Dias da semana */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={12} color="var(--text-4)" />
                  <label style={{ ...labelStyle, marginBottom: 0 }}>
                    Dias da semana <span style={{ fontFamily: 'var(--font-body)', textTransform: 'none', color: 'var(--text-4)' }}>(vazio = todos)</span>
                  </label>
                </div>
                <div className="flex gap-1 justify-between">
                  {(WEEKDAY_LABELS as readonly string[]).map((label, i) => {
                    const dow    = i as WeekdayIndex
                    const active = weekDays.includes(dow)
                    return (
                      <button key={dow} type="button" onClick={() => toggleWeekDay(dow)}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background:  active ? 'var(--amber-soft)' : 'var(--bg-2)',
                          color:       active ? 'var(--amber)' : 'var(--text-3)',
                          border:      `1px solid ${active ? 'var(--amber-line)' : 'var(--line)'}`,
                          fontFamily:  'var(--font-mono)', fontSize: 10,
                          letterSpacing: '0.1em',
                        }}>
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Categoria */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag size={12} color="var(--text-4)" />
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Categoria</label>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map((c) => (
                    <button key={c} onClick={() => setCat(c)} className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: cat === c ? getCategoryBg(c) : 'var(--bg-2)',
                        color:      cat === c ? getCategoryColor(c) : 'var(--text-3)',
                        border:     `1px solid ${cat === c ? getCategoryColor(c) + '50' : 'var(--line)'}`,
                        fontWeight: cat === c ? 600 : 400,
                      }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prioridade */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Flag size={12} color="var(--text-4)" />
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Prioridade</label>
                </div>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button key={p} onClick={() => setPrio(p)} className="px-3 py-2 rounded-lg text-xs font-medium transition-all flex-1"
                      style={{
                        background: prio === p ? `${getPriorityColor(p)}12` : 'var(--bg-2)',
                        color:      prio === p ? getPriorityColor(p) : 'var(--text-3)',
                        border:     `1px solid ${prio === p ? getPriorityColor(p) + '45' : 'var(--line)'}`,
                        fontWeight: prio === p ? 600 : 400,
                        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em',
                      }}>
                      {p === 'Alta' ? '↑ Alta' : p === 'Média' ? '→ Média' : '↓ Baixa'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sync Google Calendar */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div onClick={() => setSyncCal(!syncCal)}
                  className="rounded-full transition-all flex-shrink-0 relative"
                  style={{ width: 38, height: 20, background: syncCal ? 'var(--amber)' : 'var(--line)', cursor: 'pointer' }}>
                  <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all"
                    style={{ left: syncCal ? '1.25rem' : '0.125rem' }} />
                </div>
                <div className="flex items-center gap-1.5">
                  <CalendarPlus size={13} color={syncCal ? 'var(--amber)' : 'var(--text-3)'} />
                  <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Sincronizar com Google Calendar</span>
                </div>
              </label>

              {!getToken() && syncCal && (
                <p style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>
                  ⚠ Conecte o Google Calendar em Config → Google Calendar.
                </p>
              )}

              {error && (
                <div style={{ padding: '8px 12px', background: 'var(--red-soft)', border: '1px solid var(--red)', borderRadius: 8 }}>
                  <p style={{ fontSize: 11, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>⚠ {error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 flex-shrink-0"
              style={{ padding: '12px 18px', borderTop: '1px solid var(--line)', background: 'var(--bg-2)' }}>
              <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
              <Button size="sm" onClick={() => void handleSubmit()} disabled={loading}>
                {loading ? (isEditing ? 'Salvando…' : 'Criando…') : isEditing ? '✓ Salvar alterações' : '+ Criar tarefa'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
