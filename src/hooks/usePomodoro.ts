import { useEffect, useRef } from 'react'
import { usePomodoroStore } from '@/store/pomodoroStore'
import { useUserStore } from '@/store/userStore'

export function usePomodoro() {
  const store = usePomodoroStore()
  const { recordPomodoro } = useUserStore()
  const prevMode = useRef(store.mode)

  useEffect(() => {
    if (!store.isRunning) return
    const id = setInterval(() => store.tick(), 1000)
    return () => clearInterval(id)
  }, [store.isRunning]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (prevMode.current !== store.mode && prevMode.current === 'focus') {
      recordPomodoro(store.settings.focus)
    }
    prevMode.current = store.mode
  }, [store.mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const { mode, timeLeft, settings } = store
  // Guards: prevent NaN if settings came from corrupted localStorage
  const mins = mode === 'focus' ? settings.focus : mode === 'short-break' ? settings.shortBreak : settings.longBreak
  const totalSeconds = Math.max(60, (Number.isFinite(mins) ? mins : 25) * 60)
  const progressPct  = Math.min(100, Math.max(0, ((totalSeconds - timeLeft) / totalSeconds) * 100))

  return { ...store, progressPct }
}
