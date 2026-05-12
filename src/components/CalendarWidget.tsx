import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, LogOut } from 'lucide-react'
import { useCalendar } from '@/hooks/useCalendar'
import { getEventColor } from '@/lib/utils'
import type { CalendarEvent } from '@/types'
import Button from './ui/Button'

function eventTime(e: CalendarEvent): string {
  const dt = e.start.dateTime ?? e.start.date
  if (!dt) return ''
  return new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function isNow(e: CalendarEvent): boolean {
  const now   = new Date()
  const start = new Date(e.start.dateTime ?? e.start.date ?? '')
  const end   = new Date(e.end.dateTime   ?? e.end.date   ?? '')
  return now >= start && now <= end
}

function EventRow({ event }: { event: CalendarEvent }) {
  const color   = getEventColor(event.summary)
  const current = isNow(event)
  return (
    <motion.div layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
      className="reminder" style={{ borderBottomStyle: current ? 'solid' : 'dashed' }}>
      <div className="dot" style={{ background: color }} />
      <div>
        <div className="txt">{event.summary}</div>
        <div className="when">{eventTime(event)}</div>
      </div>
      {current && <span className="pill" style={{ color, borderColor: color + '50' }}>AGORA</span>}
    </motion.div>
  )
}

export default function CalendarWidget() {
  const { events, connected, loading, error, connect, disconnect, refresh } = useCalendar()

  return (
    <div className="tile flex flex-col">
      <div className="tile-head">
        <div className="title-group">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--blue)' }}>▸</span>
          <h3>Agenda</h3>
          {connected && (
            <span className="badge" style={{ color: 'var(--green)', borderColor: 'rgba(122,181,138,0.35)' }}>ON</span>
          )}
        </div>
        {connected && (
          <div className="ctrl">
            <button className="icon-btn" onClick={refresh}><RefreshCw size={11} className={loading ? 'animate-spin' : ''} /></button>
            <button className="icon-btn" onClick={disconnect} style={{ color: 'var(--red)' }}><LogOut size={11} /></button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!connected ? (
          <motion.div key="disconnected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4" style={{ padding: '2rem 1.25rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, opacity: 0.25 }}>□</div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>
                Conecte o Google Calendar
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>
                Veja seus eventos do dia em tempo real
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={connect}>
              Conectar Google Calendar
            </Button>
            {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--red)', letterSpacing: '0.1em' }}>
                ⚠ VITE_GOOGLE_CLIENT_ID não configurado
              </p>
            )}
          </motion.div>
        ) : loading && events.length === 0 ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col gap-2" style={{ padding: '8px 0' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse"
                style={{ height: 48, margin: '0 18px', background: 'var(--bg-2)', borderRadius: 6 }} />
            ))}
          </motion.div>
        ) : error ? (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3" style={{ padding: '1.5rem' }}>
            <p style={{ fontSize: 12, color: 'var(--red)' }}>{error}</p>
            <Button size="sm" variant="outline" onClick={refresh}>Tentar novamente</Button>
          </motion.div>
        ) : events.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-2" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: 24, opacity: 0.4 }}>○</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Nenhum evento hoje
            </p>
          </motion.div>
        ) : (
          <motion.div key="events" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="reminders-list overflow-y-auto" style={{ maxHeight: 'min(320px, 45vh)' }}>
            {events.map((e) => <EventRow key={e.id} event={e} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
