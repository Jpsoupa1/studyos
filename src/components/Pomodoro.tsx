import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, Settings } from 'lucide-react'
import { usePomodoro } from '@/hooks/usePomodoro'
import { formatTime } from '@/lib/utils'
import type { PomodoroMode } from '@/store/pomodoroStore'
import Button from './ui/Button'

const LABELS: Record<PomodoroMode, string> = { focus: 'Foco', 'short-break': 'Pausa curta', 'long-break': 'Pausa longa' }
const COLORS: Record<PomodoroMode, string> = { focus: 'var(--amber)', 'short-break': 'var(--green)', 'long-break': 'var(--purple)' }

const R = 80
const C = 2 * Math.PI * R

export default function Pomodoro() {
  const { mode, timeLeft, isRunning, cycleCount, todayMinutes, progressPct, settings, toggle, reset, setMode, updateSettings } = usePomodoro()
  const [showSettings, setShowSettings] = useState(false)
  const [tmp, setTmp] = useState(settings)

  const color = COLORS[mode]
  const offset = C - (progressPct / 100) * C

  return (
    <div className="tile">
      {/* Header */}
      <div className="tile-head">
        <div className="title-group">
          <span style={{ color: 'var(--amber)', display: 'flex' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </span>
          <h3>Pomodoro</h3>
          <span className="badge">CICLO #{cycleCount + 1}</span>
        </div>
        <div className="ctrl">
          <button className="icon-btn" onClick={() => setShowSettings(!showSettings)}>
            <Settings size={12} />
          </button>
        </div>
      </div>

      <div className="pomo">
        {/* Mode tabs */}
        <div className="pomo-tabs">
          {(['focus', 'short-break', 'long-break'] as PomodoroMode[]).map((m) => (
            <div key={m} className={`pomo-tab${mode === m ? ' active' : ''}`} onClick={() => setMode(m)}>
              {LABELS[m]}
            </div>
          ))}
        </div>

        {/* Ring */}
        <div className="pomo-ring">
          <svg width="180" height="180" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r={R} fill="none" stroke="var(--line)" strokeWidth="2" />
            {Array.from({ length: 60 }).map((_, i) => {
              const a = (i / 60) * Math.PI * 2
              const x1 = 90 + Math.cos(a) * 86
              const y1 = 90 + Math.sin(a) * 86
              const x2 = 90 + Math.cos(a) * (i % 5 === 0 ? 92 : 90)
              const y2 = 90 + Math.sin(a) * (i % 5 === 0 ? 92 : 90)
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--line)" strokeWidth={i % 5 === 0 ? 1.2 : 0.5} />
            })}
            <motion.circle cx="90" cy="90" r={R} fill="none" stroke={color} strokeWidth="2.5"
              strokeDasharray={C} strokeLinecap="round"
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.4, ease: 'easeOut' }} />
          </svg>
          <div className="center">
            <div className="pomo-time">{formatTime(timeLeft)}</div>
            <div className="pomo-state" style={{ color }}>{LABELS[mode]}</div>
            <div className="pomo-cycle">CICLO {cycleCount + 1}/4</div>
          </div>
        </div>

        {/* Controls */}
        <div className="pomo-ctrl">
          <button className="pomo-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
          <button className={`pomo-btn primary`} onClick={toggle}>
            {isRunning ? <><Pause size={14} /> Pausar</> : <><Play size={14} /> Iniciar</>}
          </button>
        </div>

        {/* Stats */}
        <div className="pomo-stats">
          <div className="pomo-stat">
            <div className="v">{cycleCount}</div>
            <div className="l">Concluídos hoje</div>
          </div>
          <div className="pomo-stat">
            <div className="v">{todayMinutes}<span className="u">min</span></div>
            <div className="l">Foco hoje</div>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-xl p-3"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--line)' }}>
            <p className="kicker mb-3">Configurações (min)</p>
            {([['Foco', 'focus'], ['Pausa curta', 'shortBreak'], ['Pausa longa', 'longBreak']] as const).map(([label, key]) => (
              <div key={key} className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{label}</span>
                <input type="number" min={1} max={60} value={tmp[key]}
                  onChange={(e) => setTmp({ ...tmp, [key]: Number(e.target.value) })}
                  className="w-16 rounded-lg px-2 py-1.5 text-xs text-center outline-none"
                  style={{ background: 'var(--bg)', color: 'var(--text-1)', border: '1px solid var(--line)', fontFamily: 'var(--font-mono)' }} />
              </div>
            ))}
            <Button variant="primary" size="sm" onClick={() => { updateSettings(tmp); setShowSettings(false) }} className="w-full mt-1">
              Salvar
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
