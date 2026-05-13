import type { CalendarEvent, Task, Reminder } from '@/types'
import { localTimezone, getCategoryColor } from '@/lib/utils'

declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: {
            client_id: string
            scope:     string
            callback:  (r: { access_token?: string }) => void
          }) => { requestAccessToken: () => void }
        }
      }
    }
  }
}

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

const TOKEN_KEY = 'sos-gtoken'
const EMAIL_KEY = 'sos-gemail'

export const getToken       = (): string | null => localStorage.getItem(TOKEN_KEY)
export const clearToken     = (): void => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(EMAIL_KEY) }
export const getCachedEmail = (): string | null => localStorage.getItem(EMAIL_KEY)

// ─── Helpers de cor para o Google Calendar ────────────────────────────────────
// Google Calendar colorIds: 1=lavender, 2=sage, 3=grape, 4=flamingo, 5=banana,
// 6=tangerine, 7=peacock, 8=graphite, 9=blueberry, 10=basil, 11=tomato
function categoryToColorId(category: string): string {
  const map: Record<string, string> = {
    Estudos:   '3',   // grape/violet
    Exercício: '2',   // sage/green
    Pessoal:   '7',   // peacock/blue
    Trabalho:  '5',   // banana/yellow
  }
  return map[category] ?? '8'
}

// ─── Calendar: sync incremental (detecta mudanças desde a última checagem) ────
const SYNC_TOKEN_KEY = 'sos-cal-sync-token'

export interface CalendarChange {
  id:      string
  status:  'confirmed' | 'cancelled'
  summary?: string
  start?:  { dateTime?: string; date?: string }
  end?:    { dateTime?: string; date?: string }
}

export async function fetchCalendarChanges(token: string): Promise<CalendarChange[]> {
  const syncToken = localStorage.getItem(SYNC_TOKEN_KEY)
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
  url.searchParams.set('showDeleted',   'true')
  url.searchParams.set('singleEvents',  'true')
  url.searchParams.set('maxResults',    '100')

  if (syncToken) {
    url.searchParams.set('syncToken', syncToken)
  } else {
    // Primeira vez: busca só os últimos 30 dias para obter o syncToken inicial
    const from = new Date(); from.setDate(from.getDate() - 30)
    url.searchParams.set('timeMin', from.toISOString())
    url.searchParams.set('orderBy', 'updated')
  }

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })

  // 410 Gone = syncToken expirado — reseta e tenta sem ele
  if (res.status === 410) {
    localStorage.removeItem(SYNC_TOKEN_KEY)
    return fetchCalendarChanges(token)
  }
  if (res.status === 401) { clearToken(); return [] }
  if (!res.ok) throw new Error(`Calendar sync ${res.status}`)

  const data = (await res.json()) as {
    items?: CalendarChange[]
    nextSyncToken?: string
    nextPageToken?: string
  }

  if (data.nextSyncToken) localStorage.setItem(SYNC_TOKEN_KEY, data.nextSyncToken)

  return data.items ?? []
}

export function clearCalendarSyncToken() {
  localStorage.removeItem(SYNC_TOKEN_KEY)
}

// ─── Calendar: hoje ───────────────────────────────────────────────────────────
export async function fetchTodayEvents(token: string): Promise<CalendarEvent[]> {
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const end   = new Date(); end.setHours(23, 59, 59, 999)
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
  url.searchParams.set('timeMin',      start.toISOString())
  url.searchParams.set('timeMax',      end.toISOString())
  url.searchParams.set('singleEvents', 'true')
  url.searchParams.set('orderBy',      'startTime')
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) { if (res.status === 401) clearToken(); throw new Error(`Calendar API ${res.status}`) }
  const data = (await res.json()) as { items?: CalendarEvent[] }
  return data.items ?? []
}

// ─── Calendar: criar evento de task (com bloco de horário) ───────────────────

// Mapeia WeekdayIndex (0=Dom…6=Sáb) para códigos RFC 5545 usados na RRULE
const RFC_DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const

/**
 * Encontra a primeira data ≥ startDate que cai em um dos weekDays.
 * Garante que o DTSTART do evento recorrente seja a primeira ocorrência real.
 */
function firstOccurrenceDate(startDate: string, weekDays: number[]): string {
  if (weekDays.length === 0) return startDate
  const d = new Date(startDate + 'T12:00:00')
  for (let i = 0; i < 7; i++) {
    if (weekDays.includes(d.getDay())) return d.toISOString().split('T')[0]
    d.setDate(d.getDate() + 1)
  }
  return startDate
}

export async function createCalendarEvent(token: string, task: Task): Promise<string> {
  const tz = localTimezone()

  // O DTSTART deve ser a primeira ocorrência real da tarefa
  const firstDate     = firstOccurrenceDate(task.startDate, task.weekDays)
  const startDateTime = `${firstDate}T${task.startTime}:00`
  const endDateTime   = `${firstDate}T${task.endTime}:00`   // mesmo dia — bloco de horário

  const body: Record<string, unknown> = {
    summary:     task.text,
    description: `${task.category} · ${task.priority} · Criado pelo Study OS`,
    colorId:     categoryToColorId(task.category),
    start: { dateTime: startDateTime, timeZone: tz },
    end:   { dateTime: endDateTime,   timeZone: tz },
  }

  // Adiciona recorrência quando a tarefa abrange mais de um dia
  if (task.startDate !== task.endDate) {
    // UNTIL em UTC — inclui o último dia por inteiro
    const until = task.endDate.replace(/-/g, '') + 'T235959Z'

    if (task.weekDays.length === 0) {
      // Sem restrição de dia → repete todo dia até endDate
      body.recurrence = [`RRULE:FREQ=DAILY;UNTIL=${until}`]
    } else {
      // Dias específicos → repete semanalmente só nesses dias
      const byDay = task.weekDays.map((d) => RFC_DAYS[d]).join(',')
      body.recurrence = [`RRULE:FREQ=WEEKLY;BYDAY=${byDay};UNTIL=${until}`]
    }
  }

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Calendar create ${res.status}: ${detail}`)
  }
  const data = (await res.json()) as { id: string }
  return data.id
}

// ─── Calendar: criar evento all-day de reminder ───────────────────────────────
export async function createAllDayCalendarEvent(token: string, reminder: Reminder): Promise<string> {
  // Google Calendar exige que end.date seja o dia SEGUINTE em eventos all-day
  const endDate = new Date(reminder.dueDate + 'T12:00:00')
  endDate.setDate(endDate.getDate() + 1)
  const endDateStr = endDate.toISOString().split('T')[0]

  const body = {
    summary:     `🔔 ${reminder.text}`,
    description: 'Lembrete criado pelo Study OS',
    colorId:     '4',  // flamingo/pink
    start:       { date: reminder.dueDate },
    end:         { date: endDateStr },
  }
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Calendar create all-day ${res.status}: ${detail}`)
  }
  const data = (await res.json()) as { id: string }
  return data.id
}

// ─── Calendar: deletar evento ─────────────────────────────────────────────────
export async function deleteCalendarEvent(token: string, eventId: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method:  'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  // 204 = sucesso sem corpo | 404 = evento já não existe (ok) | 410 = gone (ok)
  if (res.status === 204 || res.status === 404 || res.status === 410) return
  if (res.status === 401) { clearToken(); throw new Error('Token expirado — reconecte o Google Calendar em Config') }
  throw new Error(`Calendar delete ${res.status}: ${await res.text()}`)
}

// ─── User info ────────────────────────────────────────────────────────────────
export async function fetchUserEmail(token: string): Promise<string> {
  const cached = getCachedEmail()
  if (cached) return cached
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`Userinfo API ${res.status}`)
  const data = (await res.json()) as { email: string }
  localStorage.setItem(EMAIL_KEY, data.email)
  return data.email
}

// ─── Gmail: enviar e-mail ────────────────────────────────────────────────────
function buildRfc2822(to: string, subject: string, html: string): string {
  const msg = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    '',
    html,
  ].join('\r\n')
  return btoa(unescape(encodeURIComponent(msg))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function sendEmail(token: string, to: string, subject: string, html: string): Promise<void> {
  const raw = buildRfc2822(to, subject, html)
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ raw }),
  })
  if (!res.ok) throw new Error(`Gmail send ${res.status}: ${await res.text()}`)
}

// ─── OAuth connect ────────────────────────────────────────────────────────────
export function connectGoogle(onToken: (token: string) => void): void {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  if (!clientId) { console.warn('VITE_GOOGLE_CLIENT_ID não configurado'); return }
  if (!window.google?.accounts?.oauth2) { console.warn('Google Identity Services não carregado'); return }
  window.google.accounts.oauth2
    .initTokenClient({ client_id: clientId, scope: SCOPES, callback: (r) => {
      if (r.access_token) { localStorage.setItem(TOKEN_KEY, r.access_token); onToken(r.access_token) }
    }})
    .requestAccessToken()
}

// Exporta getCategoryColor para uso interno (avoid circular import)
export { getCategoryColor }
