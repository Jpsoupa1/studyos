import { useEffect, useRef, useCallback } from 'react'
import { useTaskStore } from '@/store/taskStore'
import { useReminderStore } from '@/store/reminderStore'
import { getToken, fetchCalendarChanges } from '@/services/google'
import { supabase, requireUID } from '@/lib/supabase'

const POLL_INTERVAL_MS = 30 * 1000  // poll de 30s como fallback
const DEBOUNCE_MS      = 2_000      // evita múltiplos syncs simultâneos ao focar

export function useGoogleCalendarSync() {
  const { tasks, loadFromDB } = useTaskStore()
  const { reminders, loadFromDB: loadReminders } = useReminderStore()
  const tasksRef     = useRef(tasks)
  const remindersRef = useRef(reminders)
  const syncingRef   = useRef(false)   // flag para evitar runs sobrepostos
  const lastSyncRef  = useRef(0)       // timestamp do último sync

  useEffect(() => { tasksRef.current     = tasks },     [tasks])
  useEffect(() => { remindersRef.current = reminders }, [reminders])

  const sync = useCallback(async (reason?: string) => {
    // Evita runs sobrepostos e throttle de 2s
    if (syncingRef.current) return
    const now = Date.now()
    if (now - lastSyncRef.current < DEBOUNCE_MS) return

    const token = getToken()
    if (!token) return

    syncingRef.current = true
    lastSyncRef.current = now

    try {
      const changes = await fetchCalendarChanges(token)
      if (changes.length === 0) return

      const userId = await requireUID()
      let needsReload = false

      for (const change of changes) {
        // ── Task criada pelo StudyOS ──────────────────────────────────────────
        const task = tasksRef.current.find((t) => t.calendarEventId === change.id)
        if (task) {
          if (change.status === 'cancelled') {
            await supabase.from('tasks').delete().eq('id', task.id).eq('user_id', userId)
            needsReload = true
            continue
          }

          if (change.summary && change.summary !== task.text) {
            await supabase.from('tasks').update({ text: change.summary }).eq('id', task.id)
            needsReload = true
          }

          if (change.start?.dateTime) {
            const dt     = new Date(change.start.dateTime)
            const dtEnd  = change.end?.dateTime ? new Date(change.end.dateTime) : null
            const newStartDate = dt.toISOString().split('T')[0]
            const newStartTime = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
            const newEndTime   = dtEnd
              ? `${String(dtEnd.getHours()).padStart(2, '0')}:${String(dtEnd.getMinutes()).padStart(2, '0')}`
              : task.endTime
            const newEndDate = dtEnd ? dtEnd.toISOString().split('T')[0] : newStartDate

            if (newStartDate !== task.startDate || newStartTime !== task.startTime || (dtEnd && newEndTime !== task.endTime)) {
              await supabase.from('tasks').update({
                start_date: newStartDate, end_date: newEndDate,
                start_time: newStartTime, end_time: newEndTime,
              }).eq('id', task.id)
              needsReload = true
            }
          }
          continue
        }

        // ── Lembrete criado pelo StudyOS ──────────────────────────────────────
        const reminder = remindersRef.current.find((r) => r.calendarEventId === change.id)
        if (reminder && change.status === 'cancelled') {
          await supabase.from('reminders').delete().eq('id', reminder.id).eq('user_id', userId)
          needsReload = true
        }
      }

      if (needsReload) {
        console.info(`[StudyOS] Calendar sync (${reason ?? 'poll'}): ${changes.length} mudanças`)
        await Promise.all([loadFromDB(), loadReminders()])
      }
    } catch (err) {
      console.warn('[StudyOS] Calendar sync error:', err)
    } finally {
      syncingRef.current = false
    }
  }, [loadFromDB, loadReminders])

  useEffect(() => {
    // Sync inicial ao montar
    void sync('mount')

    // Poll de fallback a cada 30s
    const intervalId = setInterval(() => void sync('poll'), POLL_INTERVAL_MS)

    // ── Sync instantâneo quando o usuário volta ao tab ─────────────────────
    const onVisible = () => {
      if (document.visibilityState === 'visible') void sync('tab-focus')
    }
    const onFocus = () => void sync('window-focus')

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onFocus)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onFocus)
    }
  }, [sync])
}
