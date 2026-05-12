import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserStats, DailyHabit, Achievement } from '@/types'
import { todayISO } from '@/lib/utils'

const DEFAULT_HABITS: DailyHabit[] = [
  { id: 'h1', label: 'Estudei 1h', icon: '📚', done: false },
  { id: 'h2', label: 'Fiz Pomodoro', icon: '🍅', done: false },
  { id: 'h3', label: 'Me exercitei', icon: '💪', done: false },
  { id: 'h4', label: 'Bebi água', icon: '💧', done: false },
  { id: 'h5', label: 'Revisei código', icon: '💻', done: false },
  { id: 'h6', label: 'Li algo novo', icon: '🔖', done: false },
]

const ACHIEVEMENTS_DEF: Achievement[] = [
  { id: 'a1', title: '7 Dias Seguidos', description: 'Sequência de 7 dias',  icon: '🔥', condition: (s) => s.streak >= 7 },
  { id: 'a2', title: '100 Pomodoros',   description: 'Complete 100 sessões', icon: '🍅', condition: (s) => s.totalPomodoros >= 100 },
  { id: 'a3', title: 'Mestre das Tarefas', description: 'Conclua 50 tarefas', icon: '✅', condition: (s) => s.totalTasksDone >= 50 },
  { id: 'a4', title: 'Maratonista', description: '24h de estudo acumuladas', icon: '⏱️', condition: (s) => s.totalStudyMinutes >= 1440 },
  { id: 'a5', title: 'AXIS Elite', description: 'Alcance 5000 XP', icon: '⚡', condition: (s) => s.xp >= 5000 },
]

interface UserStore {
  stats: UserStats
  habits: DailyHabit[]
  achievements: Achievement[]
  lastHabitDate: string
  addXP: (amount: number) => void
  toggleHabit: (id: string) => void
  recordTaskDone: () => void
  recordPomodoro: (minutes: number) => void
  checkAndResetDaily: () => void
}

const initStats = (): UserStats => ({
  xp: 0, streak: 0, totalTasksDone: 0,
  totalPomodoros: 0, totalStudyMinutes: 0,
  lastActiveDate: '', weeklyData: [],
})

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      stats: initStats(),
      habits: DEFAULT_HABITS.map((h) => ({ ...h })),
      achievements: ACHIEVEMENTS_DEF.map((a) => ({ ...a })),
      lastHabitDate: '',

      addXP: (amount) => {
        set((s) => ({ stats: { ...s.stats, xp: s.stats.xp + amount } }))
        // Verificar conquistas
        const { stats, achievements } = get()
        const updated = achievements.map((a) =>
          !a.unlockedAt && a.condition(stats) ? { ...a, unlockedAt: Date.now() } : a
        )
        set({ achievements: updated })
      },

      toggleHabit: (id) => {
        const habits = get().habits.map((h) => (h.id === id ? { ...h, done: !h.done } : h))
        set({ habits })
        const allDone = habits.every((h) => h.done)
        if (allDone) get().addXP(50)
        else get().addXP(5)
      },

      recordTaskDone: () => {
        const today = todayISO()
        const { stats } = get()
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
        const yStr = yesterday.toISOString().split('T')[0]
        const newStreak = stats.lastActiveDate === yStr || stats.lastActiveDate === today
          ? stats.lastActiveDate === today ? stats.streak : stats.streak + 1
          : 1

        set((s) => ({
          stats: {
            ...s.stats,
            totalTasksDone: s.stats.totalTasksDone + 1,
            streak: newStreak,
            lastActiveDate: today,
          },
        }))
        get().addXP(10)
      },

      recordPomodoro: (minutes) => {
        set((s) => ({
          stats: {
            ...s.stats,
            totalPomodoros: s.stats.totalPomodoros + 1,
            totalStudyMinutes: s.stats.totalStudyMinutes + minutes,
          },
        }))
        get().addXP(15)
        const habits = get().habits.map((h) => (h.id === 'h2' ? { ...h, done: true } : h))
        set({ habits })
      },

      checkAndResetDaily: () => {
        const { lastHabitDate, stats, habits } = get()
        const today = todayISO()
        if (lastHabitDate === today) return

        // Salvar dados do dia anterior na weeklyData antes de resetar
        if (lastHabitDate) {
          const dayData = {
            date: lastHabitDate,
            tasksDone: 0,
            pomodoroMinutes: 0,
            habitsCompleted: habits.filter((h) => h.done).length,
          }
          const weeklyData = [...stats.weeklyData.slice(-6), dayData]
          set((s) => ({ stats: { ...s.stats, weeklyData } }))
        }

        set({
          habits: DEFAULT_HABITS.map((h) => ({ ...h, done: false })),
          lastHabitDate: today,
        })
      },
    }),
    { name: 'sos-user' }
  )
)
