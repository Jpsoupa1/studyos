import { useEffect, useRef, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '@/components/Dashboard'
import AuthScreen from '@/components/AuthScreen'
import CalendarSetup from '@/components/CalendarSetup'
import { useTaskReminders } from '@/hooks/useTaskReminders'
import { useGoogleCalendarSync } from '@/hooks/useGoogleCalendarSync'
import { useTaskStore } from '@/store/taskStore'
import { useReminderStore } from '@/store/reminderStore'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { supabase } from '@/lib/supabase'
import { getToken } from '@/services/google'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function resetStores() {
  useTaskStore.setState({ tasks: [], isLoaded: false })
  useReminderStore.setState({ reminders: [], isLoaded: false })
}

// ─── Theme ────────────────────────────────────────────────────────────────────
function ThemeApplicator() {
  const { theme } = useThemeStore()
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  return null
}

// ─── Conteúdo autenticado ─────────────────────────────────────────────────────
function AppContent() {
  const { loadFromDB: loadTasks }     = useTaskStore()
  const { loadFromDB: loadReminders } = useReminderStore()

  // Mostra o setup do Google Calendar se ainda não conectado e não pulado nesta sessão
  const [calReady, setCalReady] = useState(
    () => !!getToken() || !!sessionStorage.getItem('cal-setup-skipped')
  )

  useEffect(() => {
    void loadTasks()
    void loadReminders()
  }, [])

  useTaskReminders()
  useGoogleCalendarSync()

  if (!calReady) {
    return <CalendarSetup onDone={() => setCalReady(true)} />
  }

  return <Dashboard />
}

// ─── Boot / Auth ──────────────────────────────────────────────────────────────
function AppInner() {
  const { user, loadProfileFromSession, setUser } = useAuthStore()
  const [booting, setBooting] = useState(true)
  const bootDone              = useRef(false)

  const finishBoot = () => {
    if (bootDone.current) return
    bootDone.current = true
    setBooting(false)
  }

  useEffect(() => {
    // Reseta no remount do StrictMode (desenvolvimento) para não bloquear o boot
    bootDone.current = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session) {
          // Passa a sessão diretamente — sem nova chamada de rede
          await loadProfileFromSession(session)
        } else {
          setUser(null)
          resetStores()
        }
      } catch (err) {
        console.error('[StudyOS] auth error:', event, err)
        setUser(null)
      } finally {
        finishBoot()
      }
    })

    // Safety: se onAuthStateChange nunca disparar (muito raro), desbloqueia em 5s
    const timeout = setTimeout(() => {
      if (!bootDone.current) {
        setUser(null)
        finishBoot()
      }
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-4)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          StudyOS · iniciando...
        </p>
      </div>
    )
  }

  return (
    <>
      <ThemeApplicator />
      {user ? <AppContent /> : <AuthScreen />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AppInner />
      </QueryClientProvider>
    </BrowserRouter>
  )
}
