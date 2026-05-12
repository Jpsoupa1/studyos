import { useEffect, useRef } from 'react'
import { useReminderStore } from '@/store/reminderStore'
import { getReminderNotificationCandidates } from '@/services/email'
import { todayISO } from '@/lib/utils'

export function useTaskReminders() {
  const { reminders, markNotificationSent } = useReminderStore()
  const ranRef = useRef(false)

  const checkAndMark = async () => {
    const today      = todayISO()
    const candidates = getReminderNotificationCandidates(reminders)
    for (const { reminder } of candidates) {
      try {
        await markNotificationSent(reminder.id, today)
        console.info(`[Study OS] Lembrete "${reminder.text}" marcado como notificado`)
      } catch (e) {
        console.error('[Study OS] Falha ao marcar lembrete:', e)
      }
    }
  }

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true
    void checkAndMark()
    const id = setInterval(() => void checkAndMark(), 60 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!ranRef.current) return
    void checkAndMark()
  }, [reminders.length])
}
