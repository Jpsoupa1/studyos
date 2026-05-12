import { create } from 'zustand'
import type { Reminder } from '@/types'
import { generateId, todayISO } from '@/lib/utils'
import { supabase, requireUID } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToReminder(row: any): Reminder {
  return {
    id:                 row.id,
    text:               row.text,
    dueDate:            row.due_date,
    done:               row.done,
    createdAt:          row.created_at,
    calendarEventId:    row.calendar_event_id ?? undefined,
    notificationsSent:  row.notifications_sent ?? [],
  }
}

function reminderToRow(r: Reminder, userId: string) {
  return {
    id:                  r.id,
    user_id:             userId,
    text:                r.text,
    due_date:            r.dueDate,
    done:                r.done,
    created_at:          r.createdAt,
    calendar_event_id:   r.calendarEventId   ?? null,
    notifications_sent:  r.notificationsSent ?? [],
  }
}

interface ReminderStore {
  reminders: Reminder[]
  isLoaded:  boolean
  loadFromDB:           () => Promise<void>
  addReminder:          (text: string, dueDate: string) => Promise<Reminder>
  toggleReminder:       (id: string) => Promise<void>
  deleteReminder:       (id: string) => Promise<void>
  markCalendarSynced:   (id: string, eventId: string) => Promise<void>
  markNotificationSent: (id: string, date: string) => Promise<void>
  todayReminders:       () => Reminder[]
  weekReminders:        (weekStart: Date) => Reminder[]
}

export const useReminderStore = create<ReminderStore>()((set, get) => ({
  reminders: [],
  isLoaded:  false,

  loadFromDB: async () => {
    set({ reminders: [], isLoaded: false })
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .order('due_date', { ascending: true })
    if (error) { console.error('[reminders] load:', error.message); set({ isLoaded: true }); return }
    set({ reminders: (data ?? []).map(rowToReminder), isLoaded: true })
  },

  addReminder: async (text, dueDate) => {
    const userId = await requireUID()
    const reminder: Reminder = {
      id:                generateId(),
      text, dueDate,
      done:              false,
      createdAt:         Date.now(),
      notificationsSent: [],
    }
    const { error } = await supabase.from('reminders').insert(reminderToRow(reminder, userId))
    if (error) throw new Error(error.message)
    set({ reminders: [...get().reminders, reminder] })
    return reminder
  },

  toggleReminder: async (id) => {
    const reminders = get().reminders.map((r) =>
      r.id === id ? { ...r, done: !r.done } : r
    )
    const reminder = reminders.find((r) => r.id === id)
    if (reminder) {
      const userId = await requireUID()
      await supabase.from('reminders').upsert(reminderToRow(reminder, userId))
    }
    set({ reminders })
  },

  deleteReminder: async (id) => {
    await supabase.from('reminders').delete().eq('id', id)
    set({ reminders: get().reminders.filter((r) => r.id !== id) })
  },

  markCalendarSynced: async (id, eventId) => {
    const userId = await requireUID()
    const reminders = get().reminders.map((r) => {
      if (r.id !== id) return r
      const updated = { ...r, calendarEventId: eventId }
      void supabase.from('reminders').upsert(reminderToRow(updated, userId))
      return updated
    })
    set({ reminders })
  },

  markNotificationSent: async (id, date) => {
    const userId = await requireUID()
    const reminders = get().reminders.map((r) => {
      if (r.id !== id) return r
      const updated = { ...r, notificationsSent: [...(r.notificationsSent ?? []), date] }
      void supabase.from('reminders').upsert(reminderToRow(updated, userId))
      return updated
    })
    set({ reminders })
  },

  todayReminders: () => {
    const today = todayISO()
    return get().reminders.filter((r) => r.dueDate === today && !r.done)
  },
  weekReminders: (weekStart) => {
    const days: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart); d.setDate(d.getDate() + i)
      days.push(d.toISOString().split('T')[0])
    }
    return get().reminders.filter((r) => days.includes(r.dueDate) && !r.done)
  },
}))
