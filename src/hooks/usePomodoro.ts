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
  }, [store.isRunning, store.tick])

  // Detecta mudança de modo (sessão concluída)
  useEffect(() => {
    if (prevMode.current !== store.mode && prevMode.current === 'focus') {
      recordPomodoro(store.settings.focus)
    }
    prevMode.current = store.mode
  }, [store.mode])

  const { mode, timeLeft, settings } = store
  const totalSeconds = (mode === 'focus' ? settings.focus : mode === 'short-break' ? settings.shortBreak : settings.longBreak) * 60
  const progressPct = ((totalSeconds - timeLeft) / totalSeconds) * 100

  return { ...store, progressPct }
}
