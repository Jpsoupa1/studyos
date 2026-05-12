// ─── Categorias e prioridades ─────────────────────────────────────────────────
export type TaskCategory = 'Estudos' | 'Exercício' | 'Pessoal' | 'Trabalho'
export type TaskPriority  = 'Alta' | 'Média' | 'Baixa'

// ─── Dias da semana (0 = Dom … 6 = Sáb) ──────────────────────────────────────
export const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const
export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

// ─── Tarefa ───────────────────────────────────────────────────────────────────
export interface SubTask {
  id:   string
  text: string
  done: boolean
}

export interface Task {
  id:       string
  text:     string
  category: TaskCategory
  priority: TaskPriority

  /** Data de início em YYYY-MM-DD (exibida como dd/MM/yyyy) */
  startDate: string
  /** Data de término em YYYY-MM-DD */
  endDate:   string
  /** Horário de início do bloco HH:mm */
  startTime: string
  /** Horário de término do bloco HH:mm */
  endTime:   string
  /** Dias da semana em que a tarefa ocorre (0=Dom…6=Sáb). Vazio = todos os dias do range. */
  weekDays:  WeekdayIndex[]

  done:        boolean
  createdAt:   number
  completedAt?: number
  subtasks:    SubTask[]
  order:       number

  /** ID do evento criado no Google Calendar */
  calendarEventId?: string
}

// ─── Lembrete ─────────────────────────────────────────────────────────────────
export interface Reminder {
  id:        string
  text:      string
  /** YYYY-MM-DD */
  dueDate:   string
  done:      boolean
  createdAt: number
  calendarEventId?: string
  /** Datas (YYYY-MM-DD) em que lembretes já foram enviados — evita duplicatas */
  notificationsSent: string[]
}

// ─── Google Calendar ──────────────────────────────────────────────────────────
export interface CalendarEvent {
  id:       string
  summary:  string
  start:    { dateTime?: string; date?: string }
  end:      { dateTime?: string; date?: string }
  colorId?: string
  description?: string
}

// ─── Pomodoro ─────────────────────────────────────────────────────────────────
export interface PomodoroSession {
  id:              string
  startedAt:       number
  endedAt:         number
  type:            'focus' | 'short-break' | 'long-break'
  completed:       boolean
  durationMinutes: number
}

// ─── Hábitos e gamificação ────────────────────────────────────────────────────
export interface DailyHabit {
  id:    string
  label: string
  icon:  string
  done:  boolean
}

export interface Achievement {
  id:          string
  title:       string
  description: string
  icon:        string
  unlockedAt?: number
  condition:   (stats: UserStats) => boolean
}

export interface DayData {
  date:             string
  tasksDone:        number
  pomodoroMinutes:  number
  habitsCompleted:  number
}

export interface UserStats {
  xp:                number
  streak:            number
  totalTasksDone:    number
  totalPomodoros:    number
  totalStudyMinutes: number
  lastActiveDate:    string
  weeklyData:        DayData[]
}

// ─── IA Coach ─────────────────────────────────────────────────────────────────
export interface ChatMessage {
  role:      'user' | 'assistant'
  content:   string
  timestamp: number
}

export type CoachMode    = 'produtividade' | 'tutor' | 'motivador'
export type StudentLevel = 'Calouro' | 'Veterano' | 'Mestre' | 'AXIS Elite'

// ─── Helpers de nível ────────────────────────────────────────────────────────
export function getLevelName(xp: number): StudentLevel {
  if (xp < 500)  return 'Calouro'
  if (xp < 2000) return 'Veterano'
  if (xp < 5000) return 'Mestre'
  return 'AXIS Elite'
}

export function getLevelProgress(xp: number): { current: number; max: number; label: StudentLevel } {
  if (xp < 500)  return { current: xp,        max: 500,  label: 'Calouro' }
  if (xp < 2000) return { current: xp - 500,  max: 1500, label: 'Veterano' }
  if (xp < 5000) return { current: xp - 2000, max: 3000, label: 'Mestre' }
  return           { current: xp - 5000, max: 5000, label: 'AXIS Elite' }
}

// ─── Helpers de datas ─────────────────────────────────────────────────────────
/** Dias até a data alvo (negativo = atrasado). Aceita YYYY-MM-DD. */
export function daysUntil(date: string): number {
  const target = new Date(date + 'T23:59:59')
  const today  = new Date(); today.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000)
}

export function urgencyColor(days: number): string {
  if (days <  0) return '#EF4444'
  if (days === 0) return '#EF4444'
  if (days <= 2)  return '#F59E0B'
  if (days <= 5)  return '#3B82F6'
  return '#10B981'
}

/**
 * Verifica se uma tarefa ocorre em um determinado dia (YYYY-MM-DD).
 * Considera startDate, endDate e weekDays.
 */
export function taskOccursOn(task: Task, dateStr: string): boolean {
  if (dateStr < task.startDate || dateStr > task.endDate) return false
  if (task.weekDays.length === 0) return true                    // sem restrição de dia
  const dow = new Date(dateStr + 'T12:00:00').getDay() as WeekdayIndex
  return task.weekDays.includes(dow)
}
