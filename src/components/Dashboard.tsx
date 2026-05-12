import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, CheckSquare, Timer, Calendar,
  BarChart2, Trophy, Settings as SettingsIcon, Menu, X,
  Plus, Bell, CalendarRange, MoreHorizontal, Bot,
  Moon, Sun, LogOut,
} from 'lucide-react'
import { useUserStore } from '@/store/userStore'
import { useTaskStore } from '@/store/taskStore'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { daysUntil } from '@/types'
import TasksOverview from './TasksOverview'
import TaskList from './TaskList'
import WeeklyCalendar from './WeeklyCalendar'
import TaskForm from './TaskForm'
import ReminderPanel from './ReminderPanel'
import Pomodoro from './Pomodoro'
import CalendarWidget from './CalendarWidget'
import AICoach from './AICoach'
import Stats from './Stats'
import DailyChecklist from './DailyChecklist'
import Achievements from './Achievements'
import Settings from './Settings'
import Button from './ui/Button'

type View = 'dashboard' | 'weekly' | 'tasks' | 'reminders' | 'pomodoro' | 'calendar' | 'coach' | 'stats' | 'achievements' | 'settings'

const NAV: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'weekly',       label: 'Calendário',    icon: CalendarRange   },
  { id: 'tasks',        label: 'Tarefas',       icon: CheckSquare     },
  { id: 'reminders',    label: 'Lembretes',     icon: Bell            },
  { id: 'pomodoro',     label: 'Pomodoro',      icon: Timer           },
  { id: 'calendar',     label: 'Google Agenda', icon: Calendar        },
  { id: 'coach',        label: 'Coach',         icon: Bot             },
  { id: 'stats',        label: 'Stats',         icon: BarChart2       },
  { id: 'achievements', label: 'Conquistas',    icon: Trophy          },
  { id: 'settings',     label: 'Config',        icon: SettingsIcon    },
]

const MOBILE_TABS: View[] = ['dashboard', 'tasks', 'pomodoro', 'reminders']

// ─── Breakpoint hook ──────────────────────────────────────────────────────
function useBreakpoint() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return { isMobile: w <= 640, isTablet: w > 640 && w <= 1024, isDesktop: w > 1024 }
}

// ─── Sidebar ──────────────────────────────────────────────────────────────
function Sidebar({ view, setView, collapsed, setCollapsed }: {
  view: View; setView: (v: View) => void; collapsed: boolean; setCollapsed: (c: boolean) => void
}) {
  const { stats } = useUserStore()
  const { user: profile, signOut: logout } = useAuthStore()
  const { theme, toggle: toggleTheme } = useThemeStore()
  const isDark  = theme === 'dark'

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 230 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="sidebar flex-shrink-0"
    >
      {/* Brand */}
      <div className="brand">
        <div className="brand-mark">
          <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="13" stroke="var(--text-2)" strokeWidth="1.25" fill="none" opacity="0.55"/>
            <path d="M 8 21 A 13 13 0 0 0 28 21" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            <circle cx="18" cy="18" r="1.6" fill="var(--amber)"/>
          </svg>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="brand-text">
              <div className="brand-name">Study OS</div>
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setCollapsed(!collapsed)}
          className="icon-btn flex-shrink-0" style={{ marginLeft: 'auto' }}>
          {collapsed ? <Menu size={12} /> : <X size={12} />}
        </button>
      </div>

      {/* Profile */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="profile">
            <div className="profile-row">
              <div style={{ minWidth: 0 }}>
                <div className="profile-name">{profile?.name || 'Usuário'}</div>
              </div>
            </div>
            <div className="profile-stats">
              <div className="profile-stat">
                <div className="v">{stats.streak}<span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 2 }}>d</span></div>
                <div className="l">Streak</div>
              </div>
              <div className="profile-stat">
                <div className="v">{stats.xp}</div>
                <div className="l">XP</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <nav className="nav">
        <div className="nav-section">Workspace</div>
        {NAV.map(({ id, label, icon: NavIcon }) => {
          const active = view === id
          return (
            <button key={id} onClick={() => setView(id)} title={collapsed ? label : undefined}
              className={`nav-item w-full${active ? ' active' : ''}`}
              style={{ border: 'none', cursor: 'pointer' }}>
              <span className="ico"><NavIcon size={15} /></span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )
        })}
        <div className="nav-section">Sistema</div>
        <div className="nav-item">
          <span className="ico"><Calendar size={15} /></span>
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Google Agenda
              </motion.span>
            )}
          </AnimatePresence>
          {!collapsed && <span className="kbd" style={{ color: 'var(--green)', borderColor: 'rgba(122,181,138,0.35)', marginLeft: 'auto' }}>ON</span>}
        </div>
      </nav>

      {/* Footer */}
      <div className="sidebar-foot">
        <div className="foot-link" onClick={toggleTheme}>
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {isDark ? 'Modo claro' : 'Modo noturno'}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="foot-link" onClick={() => void logout()} style={{ color: 'var(--red)' }}>
          <LogOut size={14} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Sair</motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  )
}

// ─── Mobile Bottom Nav ────────────────────────────────────────────────────
function MobileBottomNav({ view, setView, moreOpen, setMoreOpen }: {
  view: View; setView: (v: View) => void; moreOpen: boolean; setMoreOpen: (v: boolean) => void
}) {
  return (
    <>
      <AnimatePresence>
        {moreOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 glass-overlay"
            onClick={() => setMoreOpen(false)}>
            <motion.div
              initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 200, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-[68px] left-3 right-3 rounded-2xl border overflow-hidden"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-xl)' }}
              onClick={(e) => e.stopPropagation()}>
              <div className="p-2 grid grid-cols-3 gap-1">
                {NAV.filter((n) => !MOBILE_TABS.includes(n.id)).map(({ id, label, icon: Icon }) => {
                  const active = view === id
                  return (
                    <button key={id} onClick={() => { setView(id); setMoreOpen(false) }}
                      className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all"
                      style={{ background: active ? 'var(--amber-soft)' : 'transparent' }}>
                      <Icon size={20} style={{ color: active ? 'var(--amber)' : 'var(--text-3)' }} />
                      <span className="text-xs font-medium" style={{ color: active ? 'var(--amber)' : 'var(--text-2)' }}>{label}</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t"
        style={{
          background: 'var(--surface)', borderColor: 'var(--border)',
          height: 64, boxShadow: '0 -1px 0 var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}>
        {MOBILE_TABS.map((tabId) => {
          const nav = NAV.find((n) => n.id === tabId)!
          const active = view === tabId
          const Icon = nav.icon
          return (
            <button key={tabId} onClick={() => setView(tabId)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all"
              style={{ color: active ? 'var(--amber)' : 'var(--text-3)' }}>
              <Icon size={20} />
              <span className="text-[10px] font-medium">{nav.label}</span>
              {active && (
                <motion.div layoutId="mobile-tab-indicator"
                  className="absolute top-0 w-8 h-0.5 rounded-full"
                  style={{ background: 'var(--amber)' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }} />
              )}
            </button>
          )
        })}
        <button onClick={() => setMoreOpen(!moreOpen)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all"
          style={{ color: moreOpen || !MOBILE_TABS.includes(view) ? 'var(--amber)' : 'var(--text-3)' }}>
          <MoreHorizontal size={20} />
          <span className="text-[10px] font-medium">Mais</span>
        </button>
      </nav>
    </>
  )
}

// ─── Section label pequeno ────────────────────────────────────────────────
function SectionLabel({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{title}</span>
      {hint && <span className="text-xs ml-1" style={{ color: 'var(--text-3)' }}>{hint}</span>}
    </div>
  )
}

// ─── Dashboard Home ───────────────────────────────────────────────────────
function DashboardHome({ onNewTaskAtTime, isMobile }: {
  onNewTask?: () => void; onNewTaskAtTime: (t: string) => void; isMobile: boolean
}) {
  const { tasks } = useTaskStore()
  const overdue   = tasks.filter((t) => !t.done && daysUntil(t.endDate) < 0).length

  // Alerta de tarefas atrasadas
  const overdueAlert = overdue > 0 && (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium"
      style={{ background: 'var(--rose-soft)', color: 'var(--rose)', border: '1px solid rgba(239,68,68,0.18)' }}>
      ⚠️ {overdue} tarefa{overdue > 1 ? 's' : ''} atrasada{overdue > 1 ? 's' : ''} — revise sua agenda
    </motion.div>
  )

  // Conteúdo da coluna principal
  const mainCol = (
    <div className="flex flex-col gap-5 min-w-0">
      {overdueAlert}
      <TasksOverview />
      <div>
        <SectionLabel
          icon={<CalendarRange size={14} color="var(--sky)" />}
          title="Esta Semana"
          hint={isMobile ? undefined : 'Clique num slot para criar tarefa'}
        />
        <WeeklyCalendar onSlotClick={onNewTaskAtTime} />
      </div>
      <TaskList />
    </div>
  )

  // Mobile: coluna única
  if (isMobile) return mainCol

  // Desktop: 2 colunas (main + sidebar sticky)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 308px', gap: '1.5rem', alignItems: 'start' }}>
      {mainCol}

      {/* Sidebar direita — sticky */}
      <div className="flex flex-col gap-4" style={{ position: 'sticky', top: 0 }}>
        <Pomodoro />
        <ReminderPanel />
        <DailyChecklist />
      </div>
    </div>
  )
}

// ─── Weekly View ──────────────────────────────────────────────────────────
function WeeklyView({ onNewTaskAtTime, isMobile }: { onNewTaskAtTime: (t: string) => void; isMobile: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <WeeklyCalendar onSlotClick={onNewTaskAtTime} />
      <div className="grid gap-4" style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
        <TaskList />
        <ReminderPanel />
      </div>
    </div>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────────────────
export default function Dashboard() {
  const [view,         setView]         = useState<View>('dashboard')
  const [collapsed,    setCollapsed]    = useState(false)
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [defaultStart, setDefaultStart] = useState<string | undefined>()
  const [moreOpen,     setMoreOpen]     = useState(false)

  const { isMobile, isTablet } = useBreakpoint()

  useEffect(() => { if (isTablet) setCollapsed(true) }, [isTablet])

  const navItem = NAV.find((n) => n.id === view)

  const openNewTask    = () => { setDefaultStart(undefined); setTaskFormOpen(true) }
  const openTaskAtTime = (t: string) => { setDefaultStart(t); setTaskFormOpen(true) }

  const VIEW_MAP: Record<View, React.ReactNode> = {
    dashboard:    <DashboardHome onNewTask={openNewTask} onNewTaskAtTime={openTaskAtTime} isMobile={isMobile} />,
    weekly:       <WeeklyView onNewTaskAtTime={openTaskAtTime} isMobile={isMobile} />,
    tasks:        <div className="flex flex-col gap-4"><TasksOverview /><TaskList /></div>,
    reminders:    <ReminderPanel />,
    pomodoro:     <Pomodoro />,
    calendar:     <CalendarWidget />,
    coach:        <AICoach />,
    stats:        <Stats />,
    achievements: <Achievements />,
    settings:     <Settings />,
  }

  const profile = useAuthStore((s) => s.user)

  return (
    <div className="flex" style={{ height: '100vh', background: 'var(--bg)' }}>
      {!isMobile && (
        <Sidebar view={view} setView={setView} collapsed={collapsed} setCollapsed={setCollapsed} />
      )}

      <main className="flex-1 overflow-y-auto"
        style={{ paddingBottom: isMobile ? 'calc(64px + env(safe-area-inset-bottom, 0px))' : 0 }}>
        <div style={{ padding: 'var(--page-px)', maxWidth: 1440, margin: '0 auto' }}>

          {/* Page header — terminal editorial style */}
          <div className="page-head">
            <div>
              <div className="crumb">
                STUDYOS <span style={{ color: 'var(--text-4)' }}>//</span>{' '}
                <b>{navItem?.label?.toUpperCase() ?? 'DASHBOARD'}</b>{' '}
                <span style={{ color: 'var(--text-4)' }}>//</span>{' '}
                {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                  .toUpperCase().replace(/ DE /g, '.')}
              </div>
              <h1 className="page-title">
                {navItem?.label}<span className="slash">/</span>{profile?.name || 'StudyOS'}
              </h1>
              <div className="page-sub">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase()}
                {' · '}
                {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="head-right">
              <Button size="sm" variant="primary" onClick={openNewTask}>
                <Plus size={14} />
                {!isMobile && ' Nova tarefa'}
              </Button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={view}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}>
              {VIEW_MAP[view]}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {isMobile && (
        <MobileBottomNav view={view} setView={setView} moreOpen={moreOpen} setMoreOpen={setMoreOpen} />
      )}

      <TaskForm isOpen={taskFormOpen} onClose={() => setTaskFormOpen(false)} defaultStart={defaultStart} />
    </div>
  )
}
