import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PomodoroMode = 'focus' | 'short-break' | 'long-break'

export interface PomodoroSettings {
  focus:      number
  shortBreak: number
  longBreak:  number
}

interface PomodoroStore {
  mode:         PomodoroMode
  timeLeft:     number
  isRunning:    boolean
  cycleCount:   number
  todayMinutes: number
  settings:     PomodoroSettings
  sessionStart: number | null
  setMode:        (mode: PomodoroMode) => void
  toggle:         () => void
  reset:          () => void
  tick:           () => void
  updateSettings: (s: Partial<PomodoroSettings>) => void
}

const DEFAULTS: PomodoroSettings = { focus: 25, shortBreak: 5, longBreak: 15 }

function modeDuration(mode: PomodoroMode, s: PomodoroSettings): number {
  return (mode === 'focus' ? s.focus : mode === 'short-break' ? s.shortBreak : s.longBreak) * 60
}

export const usePomodoroStore = create<PomodoroStore>()(
  persist(
    (set, get) => ({
      mode:         'focus',
      timeLeft:     DEFAULTS.focus * 60,
      isRunning:    false,
      cycleCount:   0,
      todayMinutes: 0,
      settings:     DEFAULTS,
      sessionStart: null,

      setMode: (mode) => {
        const { settings } = get()
        set({ mode, timeLeft: modeDuration(mode, settings), isRunning: false, sessionStart: null })
      },

      toggle: () => {
        const { isRunning } = get()
        set({ isRunning: !isRunning, sessionStart: isRunning ? get().sessionStart : Date.now() })
      },

      reset: () => {
        const { mode, settings } = get()
        set({ timeLeft: modeDuration(mode, settings), isRunning: false, sessionStart: null })
      },

      tick: () => {
        const { timeLeft } = get()
        if (timeLeft > 1) { set({ timeLeft: timeLeft - 1 }); return }

        const { mode, settings, cycleCount, todayMinutes } = get()
        const duration = mode === 'focus' ? settings.focus : mode === 'short-break' ? settings.shortBreak : settings.longBreak

        const newCycle   = mode === 'focus' ? cycleCount + 1 : cycleCount
        const nextMode: PomodoroMode = mode !== 'focus' ? 'focus' : newCycle % 4 === 0 ? 'long-break' : 'short-break'

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Study OS', {
            body: mode === 'focus' ? '✅ Foco concluído! Hora de descansar.' : '🍅 Pausa encerrada. Hora de focar!',
          })
        }

        set({
          cycleCount:   newCycle,
          todayMinutes: mode === 'focus' ? todayMinutes + duration : todayMinutes,
          mode:         nextMode,
          timeLeft:     modeDuration(nextMode, settings),
          isRunning:    false,
          sessionStart: null,
        })
      },

      updateSettings: (s) => {
        const settings = { ...get().settings, ...s }
        set({ settings })
        get().reset()
      },
    }),
    {
      name: 'sos-pomodoro',
      partialize: (s) => ({ cycleCount: s.cycleCount, settings: s.settings, todayMinutes: s.todayMinutes }),
    }
  )
)
