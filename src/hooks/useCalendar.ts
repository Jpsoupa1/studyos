import { useState, useEffect, useCallback } from 'react'
import type { CalendarEvent } from '@/types'
import { fetchTodayEvents, getToken, clearToken, connectGoogle } from '@/services/google'

export function useCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (token: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchTodayEvents(token)
      setEvents(data)
      setConnected(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar eventos')
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = getToken()
    if (t) load(t)
  }, [load])

  // Auto-refresh a cada 5 minutos
  useEffect(() => {
    if (!connected) return
    const id = setInterval(() => { const t = getToken(); if (t) load(t) }, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [connected, load])

  const connect = useCallback(() => connectGoogle((t) => load(t)), [load])

  const disconnect = useCallback(() => {
    clearToken()
    setConnected(false)
    setEvents([])
  }, [])

  const refresh = useCallback(() => {
    const t = getToken()
    if (t) load(t)
  }, [load])

  return { events, connected, loading, error, connect, disconnect, refresh }
}
