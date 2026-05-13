import { useEffect, useRef } from 'react'
import { useTaskStore } from '@/store/taskStore'
import { useReminderStore } from '@/store/reminderStore'
import { getToken, fetchCalendarChanges } from '@/services/google'
import { supabase, requireUID } from '@/lib/supabase'

const POLL_INTERVAL_MS = 30 * 1000 // 30 segundos

/**
 * Detecta mudanças no Google Calendar e sincroniza com o app:
 * - Evento cancelado → deleta a task/lembrete correspondente
 * - Título mudou → atualiza o texto
 * - Horário mudou → atualiza data/hora
 * (as três condições são independentes — podem acontecer juntas)
 */
export function useGoogleCalendarSync() {
  const { tasks, loadFromDB } = useTaskStore()
  const { reminders, loadFromDB: loadReminders } = useReminderStore()
  const tasksRef     = useRef(tasks)
  const remindersRef = useRef(reminders)

  useEffect(() => { tasksRef.current     = tasks },     [tasks])
  useEffect(() => { remindersRef.current = reminders }, [reminders])

  useEffect(() => {
    const sync = async () => {
      const token = getToken()
      if (!token) return

      try {
        const changes = await fetchCalendarChanges(token)
        if (changes.length === 0) return

        const userId = await requireUID()
        let needsReload = false

        for (const change of changes) {
          // ── Verifica se é uma task criada pelo StudyOS ────────────────────────
          const task = tasksRef.current.find((t) => t.calendarEventId === change.id)
          if (task) {
            if (change.status === 'cancelled') {
              await supabase.from('tasks').delete().eq('id', task.id).eq('user_id', userId)
              needsReload = true
              continue
            }

            // Título mudou (condição independente)
            if (change.summary && change.summary !== task.text) {
              await supabase.from('tasks').update({ text: change.summary }).eq('id', task.id)
              needsReload = true
            }

            // Horário mudou (condição independente — pode acontecer junto com título)
            if (change.start?.dateTime) {
              const dt     = new Date(change.start.dateTime)
              const dtEnd  = change.end?.dateTime ? new Date(change.end.dateTime) : null
              const newStartDate = dt.toISOString().split('T')[0]
              const newStartTime = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
              const newEndTime   = dtEnd
                ? `${String(dtEnd.getHours()).padStart(2, '0')}:${String(dtEnd.getMinutes()).padStart(2, '0')}`
                : task.endTime
              const newEndDate   = dtEnd
                ? dtEnd.toISOString().split('T')[0]
                : newStartDate

              const timeChanged =
                newStartDate !== task.startDate ||
                newStartTime !== task.startTime ||
                (dtEnd && newEndTime !== task.endTime)

              if (timeChanged) {
                await supabase.from('tasks').update({
                  start_date: newStartDate,
                  end_date:   newEndDate,
                  start_time: newStartTime,
                  end_time:   newEndTime,
                }).eq('id', task.id)
                needsReload = true
              }
            }
            continue
          }

          // ── Verifica se é um lembrete criado pelo StudyOS ─────────────────────
          const reminder = remindersRef.current.find((r) => r.calendarEventId === change.id)
          if (reminder && change.status === 'cancelled') {
            await supabase.from('reminders').delete().eq('id', reminder.id).eq('user_id', userId)
            needsReload = true
          }
        }

        if (needsReload) {
          await Promise.all([loadFromDB(), loadReminders()])
        }
      } catch (err) {
        console.warn('[StudyOS] Calendar sync error:', err)
      }
    }

    void sync()
    const id = setInterval(() => void sync(), POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])
}
