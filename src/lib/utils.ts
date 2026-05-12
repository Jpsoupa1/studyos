export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

// ─── Tempo ────────────────────────────────────────────────────────────────────

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Formata HH:mm para exibição */
export function formatHHmm(hhmm: string): string {
  return hhmm.slice(0, 5)  // garante "HH:mm"
}

/** Intervalo "HH:mm – HH:mm" */
export function formatTimeRange(startHHmm: string, endHHmm: string): string {
  return `${formatHHmm(startHHmm)} – ${formatHHmm(endHHmm)}`
}

// ─── Datas ────────────────────────────────────────────────────────────────────

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

/** "2026-05-07" → "07/05/2026" */
export function isoToDDMMYYYY(iso: string): string {
  if (!iso || iso.length < 10) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** "07/05/2026" → "2026-05-07". Retorna '' se inválido. */
export function ddmmyyyyToISO(dmy: string): string {
  if (!dmy) return ''
  const parts = dmy.split('/')
  if (parts.length !== 3) return ''
  const [d, m, y] = parts
  if (!d || !m || !y || y.length !== 4) return ''
  const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  if (isNaN(Date.parse(iso))) return ''
  return iso
}

/** Valida se uma string está no formato dd/MM/yyyy com data real */
export function isValidDDMMYYYY(dmy: string): boolean {
  return ddmmyyyyToISO(dmy) !== ''
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** Extrai YYYY-MM-DD de ISO datetime ou date */
export function isoDateOf(iso: string): string {
  return iso.split('T')[0]
}

/** Retorna o timezone local (ex: "America/Sao_Paulo") */
export function localTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

// ─── Cores ────────────────────────────────────────────────────────────────────

export function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    Estudos:   '#8B5CF6',
    Exercício: '#10B981',
    Pessoal:   '#3B82F6',
    Trabalho:  '#F59E0B',
  }
  return map[category] ?? '#64748B'
}

export function getCategoryBg(category: string): string {
  const map: Record<string, string> = {
    Estudos:   'rgba(139,92,246,0.10)',
    Exercício: 'rgba(16,185,129,0.10)',
    Pessoal:   'rgba(59,130,246,0.10)',
    Trabalho:  'rgba(245,158,11,0.10)',
  }
  return map[category] ?? 'rgba(100,116,139,0.10)'
}

export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    Alta:  '#EF4444',
    Média: '#F59E0B',
    Baixa: '#10B981',
  }
  return map[priority] ?? '#64748B'
}

export function getEventColor(summary?: string): string {
  const s = summary?.toLowerCase() ?? ''
  if (s.includes('aula'))   return '#F59E0B'
  if (s.includes('estudo')) return '#8B5CF6'
  if (s.includes('prazo') || s.includes('deadline')) return '#EF4444'
  return '#3B82F6'
}
