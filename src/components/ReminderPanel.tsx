import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Plus, Trash2, CalendarDays } from 'lucide-react'
import { useReminderStore } from '@/store/reminderStore'
import { getToken, createAllDayCalendarEvent, deleteCalendarEvent } from '@/services/google'
import { todayISO } from '@/lib/utils'
import Button from './ui/Button'

export default function ReminderPanel() {
  const { reminders, loadFromDB, addReminder, toggleReminder, deleteReminder, markCalendarSynced } = useReminderStore()
  const [text,    setText]    = useState('')
  const [dueDate, setDueDate] = useState(todayISO())
  const [adding,  setAdding]  = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => { void loadFromDB() }, [])

  const handleAdd = async () => {
    if (!text.trim() || !dueDate) return
    setLoading(true)
    try {
      const reminder = await addReminder(text.trim(), dueDate)
      const token = getToken()
      if (token) {
        createAllDayCalendarEvent(token, reminder)
          .then((id) => markCalendarSynced(reminder.id, id))
          .catch((e) => console.warn('[Study OS] Reminder calendar sync:', e))
      }
      setText('')
      setDueDate(todayISO())
      setAdding(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, calendarEventId?: string) => {
    const token = getToken()
    if (token && calendarEventId) {
      deleteCalendarEvent(token, calendarEventId).catch(() => {})
    }
    await deleteReminder(id)
  }

  const sorted = [...reminders].sort((a, b) => a.dueDate < b.dueDate ? -1 : 1)
  const today  = todayISO()
  const past   = sorted.filter((r) => r.dueDate < today)
  const upcoming = sorted.filter((r) => r.dueDate >= today)

  return (
    <div className="tile">
      {/* Header */}
      <div className="tile-head">
        <div className="title-group">
          <Bell size={13} color="var(--amber)" />
          <h3>Lembretes</h3>
          {reminders.filter((r) => r.dueDate === today && !r.done).length > 0 && (
            <span className="badge" style={{ color: 'var(--red)', borderColor: 'var(--red)' }}>HOJE</span>
          )}
        </div>
        <div className="ctrl">
          <button className="icon-btn" onClick={() => setAdding(!adding)}><Plus size={12} /></button>
        </div>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden" style={{ borderBottom: '1px solid var(--line)' }}>
            <div className="flex flex-col gap-2 p-4" style={{ background: 'var(--bg-2)' }}>
              <input value={text} onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleAdd(); if (e.key === 'Escape') setAdding(false) }}
                placeholder="Descrição do lembrete..." autoFocus
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--surface)', color: 'var(--text-1)', border: '1px solid var(--line)' }} />
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <CalendarDays size={13} color="var(--text-3)" className="flex-shrink-0" />
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                    className="rounded-lg px-3 py-1.5 text-sm outline-none flex-1 min-w-0"
                    style={{ background: 'var(--surface)', color: 'var(--text-1)', border: '1px solid var(--line)' }} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button>
                  <Button size="sm" onClick={() => void handleAdd()} disabled={loading || !text.trim()}>
                    {loading ? '…' : 'Criar'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reminders list */}
      <div className="reminders-list" style={{ maxHeight: 'min(280px, 38vh)', overflowY: 'auto' }}>
        {reminders.length === 0 && (
          <div className="text-center py-8" style={{ color: 'var(--text-3)' }}>
            <Bell size={24} className="mx-auto mb-2 opacity-25" />
            <p style={{ fontSize: 12 }}>Nenhum lembrete criado</p>
          </div>
        )}
        {upcoming.map((r) => {
          const isToday = r.dueDate === today
          const dotColor = isToday ? 'var(--red)' : 'var(--amber)'
          return (
            <motion.div key={r.id} className="reminder" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={() => void toggleReminder(r.id)}>
              <div className="dot" style={{ background: dotColor }} />
              <div>
                <div className={`txt${r.done ? ' line-through opacity-50' : ''}`}>{r.text}</div>
                <div className="when">
                  {new Date(r.dueDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  {isToday && ' — hoje'}
                  {r.calendarEventId && ' · 📆'}
                </div>
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <span className="pill" style={{ color: isToday ? 'var(--red)' : 'var(--amber)', borderColor: isToday ? 'var(--red)' : 'var(--amber-line)' }}>
                  {isToday ? 'URGENTE' : 'PRAZO'}
                </span>
                <button className="icon-btn" onClick={() => void handleDelete(r.id, r.calendarEventId)}
                  style={{ color: 'var(--red)' }}>
                  <Trash2 size={11} />
                </button>
              </div>
            </motion.div>
          )
        })}
        {past.filter((r) => !r.done).map((r) => (
          <motion.div key={r.id} className="reminder" layout style={{ opacity: 0.5 }}>
            <div className="dot" style={{ background: 'var(--text-4)' }} />
            <div>
              <div className="txt">{r.text}</div>
              <div className="when">{new Date(r.dueDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</div>
            </div>
            <span className="pill" style={{ color: 'var(--red)' }}>PASSADO</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
