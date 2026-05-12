import type { Reminder } from '@/types'
import { daysUntil } from '@/types'
import { todayISO } from '@/lib/utils'

export interface ReminderCandidate { reminder: Reminder; daysLeft: number }

export function getReminderNotificationCandidates(reminders: Reminder[]): ReminderCandidate[] {
  const today = todayISO()
  return reminders
    .filter((r) => {
      if (r.done) return false
      const days = daysUntil(r.dueDate)
      if (days < 0 || days > 3) return false
      return !(r.notificationsSent ?? []).includes(today)
    })
    .map((reminder) => ({ reminder, daysLeft: daysUntil(reminder.dueDate) }))
}
