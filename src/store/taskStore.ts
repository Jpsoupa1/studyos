import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Task, TaskCategory, TaskPriority, SubTask, WeekdayIndex } from '@/types'
import { taskOccursOn } from '@/types'
import { generateId, todayISO } from '@/lib/utils'
import { supabase, requireUID } from '@/lib/supabase'

// ─── Conversão DB (snake_case) ↔ App (camelCase) ──────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTask(row: any): Task {
  return {
    id:              row.id,
    text:            row.text,
    category:        row.category  as TaskCategory,
    priority:        row.priority  as TaskPriority,
    startDate:       row.start_date,
    endDate:         row.end_date,
    startTime:       row.start_time,
    endTime:         row.end_time,
    weekDays:        (row.week_days ?? []) as WeekdayIndex[],
    done:            row.done,
    createdAt:       row.created_at,
    completedAt:     row.completed_at ?? undefined,
    subtasks:        row.subtasks   ?? [],
    order:           row.order      ?? 0,
    calendarEventId: row.calendar_event_id ?? undefined,
  }
}

function taskToRow(task: Task, userId: string) {
  return {
    id:                task.id,
    user_id:           userId,
    text:              task.text,
    category:          task.category,
    priority:          task.priority,
    start_date:        task.startDate,
    end_date:          task.endDate,
    start_time:        task.startTime,
    end_time:          task.endTime,
    week_days:         task.weekDays,
    done:              task.done,
    created_at:        task.createdAt,
    completed_at:      task.completedAt  ?? null,
    subtasks:          task.subtasks,
    order:             task.order,
    calendar_event_id: task.calendarEventId ?? null,
  }
}

// ─── Types ─────────────────────────────────────────────────────────────────
type FilterStatus = 'all' | 'pending' | 'done'
type FilterPeriod = 'all' | 'today' | 'week'

interface TaskFilter {
  category: TaskCategory | 'all'
  priority: TaskPriority | 'all'
  status:   FilterStatus
  period:   FilterPeriod
}

export interface AddTaskOptions {
  text:      string
  category:  TaskCategory
  priority:  TaskPriority
  startDate: string
  endDate:   string
  startTime: string
  endTime:   string
  weekDays:  WeekdayIndex[]
}

interface TaskStore {
  tasks:    Task[]
  filter:   TaskFilter
  isLoaded: boolean
  loadFromDB:            () => Promise<void>
  addTask:               (opts: AddTaskOptions) => Promise<Task>
  updateTask:            (id: string, opts: AddTaskOptions) => Promise<void>
  toggleTask:            (id: string) => Promise<void>
  deleteTask:            (id: string) => Promise<void>
  addSubtask:            (taskId: string, text: string) => Promise<void>
  toggleSubtask:         (taskId: string, subId: string) => Promise<void>
  updateCalendarEventId: (taskId: string, eventId: string) => Promise<void>
  setFilter:             (f: Partial<TaskFilter>) => void
  todayTasks:            () => Task[]
  todayProgress:         () => number
  upcomingTasks:         () => Task[]
  tasksForDay:           (dateStr: string) => Task[]
  weekTasks:             (weekStart: Date) => Task[]
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [], isLoaded: false,
      filter: { category: 'all', priority: 'all', status: 'all', period: 'all' },

      loadFromDB: async () => {
        set({ tasks: [], isLoaded: false })
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('order', { ascending: true })
        if (error) { console.error('[tasks] load:', error.message); set({ isLoaded: true }); return }
        set({ tasks: (data ?? []).map(rowToTask), isLoaded: true })
      },

      addTask: async ({ text, category, priority, startDate, endDate, startTime, endTime, weekDays }) => {
        const userId = await requireUID()
        const task: Task = {
          id: generateId(), text, category, priority,
          startDate, endDate, startTime, endTime, weekDays,
          done: false, createdAt: Date.now(), subtasks: [], order: get().tasks.length,
        }
        const { error } = await supabase.from('tasks').insert(taskToRow(task, userId))
        if (error) throw new Error(error.message)
        set({ tasks: [...get().tasks, task] })
        return task
      },

      updateTask: async (id, { text, category, priority, startDate, endDate, startTime, endTime, weekDays }) => {
        const userId = await requireUID()
        const tasks = get().tasks.map((t) => {
          if (t.id !== id) return t
          return { ...t, text, category, priority, startDate, endDate, startTime, endTime, weekDays }
        })
        const updated = tasks.find((t) => t.id === id)
        if (updated) await supabase.from('tasks').update(taskToRow(updated, userId)).eq('id', id)
        set({ tasks })
      },

      toggleTask: async (id) => {
        const tasks = get().tasks.map((t) =>
          t.id === id ? { ...t, done: !t.done, completedAt: !t.done ? Date.now() : undefined } : t
        )
        const task = tasks.find((t) => t.id === id)
        if (task) {
          const userId = await requireUID()
          await supabase.from('tasks').upsert(taskToRow(task, userId))
        }
        set({ tasks })
      },

      deleteTask: async (id) => {
        await supabase.from('tasks').delete().eq('id', id)
        set({ tasks: get().tasks.filter((t) => t.id !== id) })
      },

      addSubtask: async (taskId, text) => {
        const userId = await requireUID()
        const tasks = get().tasks.map((t) => {
          if (t.id !== taskId) return t
          const sub: SubTask = { id: generateId(), text, done: false }
          const updated = { ...t, subtasks: [...t.subtasks, sub] }
          void supabase.from('tasks').upsert(taskToRow(updated, userId))
          return updated
        })
        set({ tasks })
      },

      toggleSubtask: async (taskId, subId) => {
        const userId = await requireUID()
        const tasks = get().tasks.map((t) => {
          if (t.id !== taskId) return t
          const updated = { ...t, subtasks: t.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s)) }
          void supabase.from('tasks').upsert(taskToRow(updated, userId))
          return updated
        })
        set({ tasks })
      },

      updateCalendarEventId: async (taskId, eventId) => {
        const userId = await requireUID()
        const tasks = get().tasks.map((t) => {
          if (t.id !== taskId) return t
          const updated = { ...t, calendarEventId: eventId }
          void supabase.from('tasks').upsert(taskToRow(updated, userId))
          return updated
        })
        set({ tasks })
      },

      setFilter: (f) => set({ filter: { ...get().filter, ...f } }),

      todayTasks: () => {
        const today = todayISO()
        return get().tasks.filter((t) => taskOccursOn(t, today))
      },
      todayProgress: () => {
        const today = get().todayTasks()
        if (!today.length) return 0
        return Math.round((today.filter((t) => t.done).length / today.length) * 100)
      },
      upcomingTasks: () => {
        const today = todayISO()
        return get().tasks
          .filter((t) => !t.done && t.endDate >= today)
          .sort((a, b) => (a.endDate < b.endDate ? -1 : a.startTime < b.startTime ? -1 : 1))
      },
      tasksForDay: (dateStr) => get().tasks.filter((t) => taskOccursOn(t, dateStr)),
      weekTasks: (weekStart) => {
        const days: string[] = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(weekStart); d.setDate(d.getDate() + i)
          return d.toISOString().split('T')[0]
        })
        const seen = new Set<string>()
        const result: Task[] = []
        for (const day of days) {
          for (const task of get().tasks) {
            if (!seen.has(task.id) && taskOccursOn(task, day)) {
              seen.add(task.id); result.push(task)
            }
          }
        }
        return result
      },
    }),
    {
      name: 'sos-tasks-v5',
      partialize: (s) => ({ filter: s.filter }),
    }
  )
)
