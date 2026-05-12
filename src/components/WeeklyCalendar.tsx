import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { useTaskStore } from '@/store/taskStore'
import { useReminderStore } from '@/store/reminderStore'
import { getCategoryColor, getCategoryBg, todayISO } from '@/lib/utils'
import type { Task } from '@/types'

// ─── Grid constants ────────────────────────────────────────────────────────
const HOUR_START  = 6
const HOUR_END    = 22
const HOURS       = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i)
const PX_PER_MIN  = 1.4
const HOUR_PX     = 60 * PX_PER_MIN
const GRID_HEIGHT = (HOUR_END - HOUR_START) * HOUR_PX
const TIME_COL_W  = 52

const PT_DAYS   = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const PT_MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

// ─── Helpers ──────────────────────────────────────────────────────────────
function getMonday(date: Date): Date {
  const d = new Date(date)
  const dow = d.getDay()
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d
  })
}

function topPx(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return Math.max(0, ((h - HOUR_START) * 60 + (m ?? 0)) * PX_PER_MIN)
}

function heightPx(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const diff = (eh * 60 + (em ?? 0)) - (sh * 60 + (sm ?? 0))
  return Math.max(PX_PER_MIN * 20, diff * PX_PER_MIN)
}

function resolveOverlaps(tasks: Task[]): Map<string, { width: string; left: string }> {
  const result = new Map<string, { width: string; left: string }>()
  const sorted = [...tasks].sort((a, b) => (a.startTime < b.startTime ? -1 : 1))
  const cols: Task[][] = []
  for (const task of sorted) {
    let placed = false
    for (const col of cols) {
      if (col[col.length - 1].endTime <= task.startTime) { col.push(task); placed = true; break }
    }
    if (!placed) cols.push([task])
  }
  const total = cols.length
  cols.forEach((col, ci) => col.forEach((task) => {
    result.set(task.id, {
      width: total === 1 ? 'calc(100% - 8px)' : `calc(${100 / total}% - 5px)`,
      left:  total === 1 ? '4px' : `calc(${(ci / total) * 100}% + 3px)`,
    })
  }))
  return result
}

// ─── useIsMobile ──────────────────────────────────────────────────────────
function useIsMobile() {
  const [is, setIs] = useState(typeof window !== 'undefined' ? window.innerWidth <= 640 : false)
  useEffect(() => {
    const h = () => setIs(window.innerWidth <= 640)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return is
}

// ─── Task Block ───────────────────────────────────────────────────────────
function TaskBlock({ task, onClick }: { task: Task; onClick: (t: Task) => void }) {
  const top     = topPx(task.startTime)
  const height  = heightPx(task.startTime, task.endTime)
  const color   = getCategoryColor(task.category)
  const bg      = getCategoryBg(task.category)
  const isTiny  = height < HOUR_PX * 0.38
  const isShort = height < HOUR_PX * 0.75

  if (top < 0 || top > GRID_HEIGHT) return null

  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.92 }}
      animate={{ opacity: 1, scaleY: 1 }}
      onClick={() => onClick(task)}
      className="absolute overflow-hidden cursor-pointer select-none"
      style={{
        top:          `${top}px`,
        height:       `${height}px`,
        borderRadius: 8,
        background:   bg,
        borderLeft:   `3px solid ${color}`,
        padding:      isTiny ? '1px 6px' : isShort ? '3px 7px' : '5px 8px',
        boxShadow:    `0 0 0 1px ${color}22, 0 2px 8px ${color}18`,
        transition:   'box-shadow 0.15s',
        zIndex: 1,
      }}
      whileHover={{ boxShadow: `0 0 0 1.5px ${color}55, 0 4px 14px ${color}30`, zIndex: 10 }}
      transition={{ duration: 0.12 }}
    >
      {task.done && (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: `${bg}D0`, borderRadius: 8 }}>
          <span style={{ fontSize: 13 }}>✅</span>
        </div>
      )}
      <p className="text-xs font-semibold leading-tight truncate"
        style={{ color, opacity: task.done ? 0.45 : 1 }}>
        {task.text}
      </p>
      {!isTiny && !isShort && (
        <p className="text-[10px] mt-0.5 leading-tight opacity-75 truncate" style={{ color }}>
          {task.startTime} – {task.endTime}
        </p>
      )}
    </motion.div>
  )
}

// ─── Now Line ─────────────────────────────────────────────────────────────
function NowLine() {
  const now = new Date()
  const minutes = (now.getHours() - HOUR_START) * 60 + now.getMinutes()
  if (minutes < 0 || minutes > (HOUR_END - HOUR_START) * 60) return null
  const top = minutes * PX_PER_MIN

  return (
    <div className="now-line absolute pointer-events-none" style={{ top: `${top}px`, zIndex: 20 }} />
  )
}

// ─── Mobile Day Selector ──────────────────────────────────────────────────
function MobileDaySelector({ weekDays, selected, onSelect, today }: {
  weekDays: Date[]; selected: number; onSelect: (i: number) => void; today: string
}) {
  return (
    <div className="flex gap-1 px-3 py-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
      {weekDays.map((day, i) => {
        const iso     = day.toISOString().split('T')[0]
        const isToday = iso === today
        const active  = selected === i
        return (
          <button key={i} onClick={() => onSelect(i)}
            className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all flex-shrink-0"
            style={{
              background: active ? (isToday ? 'var(--accent)' : 'var(--border)') : 'transparent',
              minWidth: 42,
            }}>
            <span className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: active ? (isToday ? '#fff' : 'var(--text-1)') : 'var(--text-3)' }}>
              {PT_DAYS[day.getDay()]}
            </span>
            <span className="text-sm font-bold font-display"
              style={{ color: active ? (isToday ? '#fff' : 'var(--text-1)') : 'var(--text-2)' }}>
              {day.getDate()}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────
interface WeeklyCalendarProps {
  onTaskClick?: (task: Task) => void
  onSlotClick?: (startTime: string) => void
}

export default function WeeklyCalendar({ onTaskClick, onSlotClick }: WeeklyCalendarProps) {
  const [weekStart,    setWeekStart]    = useState<Date>(getMonday(new Date()))
  const [selectedDay,  setSelectedDay]  = useState(0)
  const { tasksForDay }   = useTaskStore()
  const { weekReminders } = useReminderStore()
  const scrollRef   = useRef<HTMLDivElement>(null)
  const isMobile    = useIsMobile()
  const today       = todayISO()
  const weekDays    = getWeekDays(weekStart)
  const reminders   = weekReminders(weekStart)
  const tasksByDay  = weekDays.map((d) => tasksForDay(d.toISOString().split('T')[0]))
  const overlapMaps = tasksByDay.map(resolveOverlaps)

  // Auto-select today and scroll to current time
  useEffect(() => {
    const idx = weekDays.findIndex((d) => d.toISOString().split('T')[0] === today)
    if (idx !== -1) setSelectedDay(idx)
  }, [weekStart])

  useEffect(() => {
    if (!scrollRef.current) return
    const now = new Date()
    const mins = (now.getHours() - HOUR_START) * 60 + now.getMinutes()
    if (mins >= 0) {
      const top = mins * PX_PER_MIN
      const offset = scrollRef.current.clientHeight / 3
      scrollRef.current.scrollTop = Math.max(0, top - offset)
    }
  }, [])

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d) }
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d) }
  const goToday  = () => setWeekStart(getMonday(new Date()))

  const weekLabel = () => {
    const s = weekDays[0]; const e = weekDays[6]
    if (s.getMonth() === e.getMonth())
      return `${s.getDate()} – ${e.getDate()} de ${PT_MONTHS[s.getMonth()]} ${s.getFullYear()}`
    return `${s.getDate()} ${PT_MONTHS[s.getMonth()]} – ${e.getDate()} ${PT_MONTHS[e.getMonth()]} ${e.getFullYear()}`
  }

  const handleSlotClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSlotClick) return
    const rect    = e.currentTarget.getBoundingClientRect()
    const mins    = Math.round((e.clientY - rect.top) / PX_PER_MIN / 15) * 15
    const h       = HOUR_START + Math.floor(mins / 60)
    const m       = mins % 60
    onSlotClick(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }

  const visibleDays = isMobile ? [selectedDay] : Array.from({ length: 7 }, (_, i) => i)

  return (
    <div className="tile flex flex-col overflow-hidden">

      {/* ── Toolbar ── */}
      <div className="tile-head flex-shrink-0">
        <div className="title-group">
          <CalendarDays size={13} color="var(--blue)" />
          <h3>{isMobile ? 'Semana' : 'Calendário Semanal'}</h3>
          <span className="badge">{weekLabel()}</span>
        </div>
        <div className="ctrl">
          <button className="icon-btn" onClick={prevWeek}><ChevronLeft size={12} /></button>
          <div className="badge" onClick={goToday} style={{ cursor: 'pointer', color: 'var(--amber)', borderColor: 'var(--amber-line)' }}>HOJE</div>
          <button className="icon-btn" onClick={nextWeek}><ChevronRight size={12} /></button>
        </div>
      </div>

      {/* ── Mobile day selector ── */}
      {isMobile && (
        <div className="border-b" style={{ borderColor: 'var(--border)' }}>
          <MobileDaySelector weekDays={weekDays} selected={selectedDay} onSelect={setSelectedDay} today={today} />
        </div>
      )}

      {/* ── Desktop day header ── */}
      {!isMobile && (
        <div className="cal" style={{ borderBottom: '1px solid var(--line)' }}>
          <div className="cal-grid cal-header-row">
            <div className="cal-corner" />
            {weekDays.map((day, i) => {
              const iso     = day.toISOString().split('T')[0]
              const isToday = iso === today
              const dayRems = reminders.filter((r) => r.dueDate === iso)
              return (
                <div key={i} className={`cal-day-head${isToday ? ' today' : ''}`}>
                  <div className="dow">{PT_DAYS[day.getDay()]}</div>
                  <div className="dom">{day.getDate()}</div>
                  {dayRems.map((r) => (
                    <div key={r.id} style={{ fontSize: 9, background: 'var(--green-soft)', color: 'var(--green)', padding: '1px 4px', borderRadius: 3, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      🔔 {r.text}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Time grid ── */}
      <div ref={scrollRef} className="overflow-y-auto flex-1"
        style={{ maxHeight: isMobile ? 400 : 500 }}>
        <div className="flex" style={{ height: GRID_HEIGHT + 16, position: 'relative' }}>

          {/* Time gutter */}
          <div style={{ width: TIME_COL_W, flexShrink: 0, position: 'relative', borderRight: '1px solid var(--line-soft)' }}>
            {HOURS.slice(0, -1).map((h) => (
              <div key={h} style={{ height: HOUR_PX, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 8, paddingTop: 4 }}>
                <span style={{ fontSize: 9.5, color: 'var(--text-4)', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {visibleDays.map((dayIdx) => {
            const day     = weekDays[dayIdx]
            const iso     = day.toISOString().split('T')[0]
            const isToday = iso === today

            return (
              <div key={dayIdx} className="flex-1 min-w-0 relative"
                style={{ borderLeft: '1px solid var(--line-soft)' }}
                onClick={handleSlotClick}>

                {/* Grid rows */}
                {HOURS.slice(0, -1).map((h) => (
                  <div key={h} style={{
                    height: HOUR_PX,
                    borderBottom: '1px solid var(--line-soft)',
                    boxSizing: 'border-box',
                  }}>
                    <div style={{ height: '50%', borderBottom: '1px dashed var(--line-soft)' }} />
                  </div>
                ))}

                {/* Now line — only in today's column */}
                {isToday && <NowLine />}

                {/* Task blocks */}
                {tasksByDay[dayIdx].map((task) => {
                  const layout = overlapMaps[dayIdx].get(task.id)
                  return (
                    <div key={task.id} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                      <div style={{ position: 'absolute', width: layout?.width, left: layout?.left, top: 0, bottom: 0, pointerEvents: 'auto' }}>
                        <TaskBlock task={task} onClick={(t) => onTaskClick?.(t)} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
