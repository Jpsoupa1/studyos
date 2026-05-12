import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { useUserStore } from '@/store/userStore'
import ProgressBar from './ui/ProgressBar'

export default function DailyChecklist() {
  const { habits, stats, toggleHabit, checkAndResetDaily } = useUserStore()

  useEffect(() => { checkAndResetDaily() }, [])

  const done = habits.filter((h) => h.done).length
  const allDone = done === habits.length

  const STREAK_DAYS = 14

  return (
    <div className="tile">
      {/* Header */}
      <div className="tile-head">
        <div className="title-group">
          <Flame size={13} color="var(--amber)" />
          <h3>Hábitos diários</h3>
          <span className="badge" style={{ color: 'var(--amber)', borderColor: 'var(--amber-line)' }}>
            {done}/{habits.length}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div style={{ padding: '10px 18px 0' }}>
        <ProgressBar value={done} max={habits.length} color="var(--green)" />
      </div>

      {allDone && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          style={{ margin: '8px 18px 0', padding: '7px 12px', background: 'var(--green-soft)', border: '1px solid var(--green)', borderRadius: 8, fontSize: 12, color: 'var(--green)' }}>
          Todos os hábitos completos! +50 XP
        </motion.div>
      )}

      {/* Habits list */}
      <div className="habits">
        {habits.map((habit, i) => (
          <motion.div key={habit.id} className={`habit${habit.done ? ' done' : ''}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
            onClick={() => toggleHabit(habit.id)}>
            <div className="habit-box">
              {habit.done && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0E0E14" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 15 }}>{habit.icon}</span>
              <span className="lbl">{habit.label}</span>
            </div>
            <div className="xp">+20 XP</div>
          </motion.div>
        ))}
      </div>

      {/* Streak strip */}
      <div className="streak-strip">
        <div>
          <div className="kicker" style={{ marginBottom: 4 }}>STREAK</div>
          <div className="streak-num">{stats.streak}<span className="u">d</span></div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="streak-bars">
            {Array.from({ length: STREAK_DAYS }).map((_, i) => {
              const daysAgo = STREAK_DAYS - 1 - i
              const filled = daysAgo < stats.streak
              const isToday = daysAgo === 0
              return (
                <div key={i} className={`streak-bar${filled ? ' filled' : ''}${filled && daysAgo > 2 ? ' dim' : ''}${isToday ? ' today' : ''}`} />
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-4)', letterSpacing: '0.12em' }}>
            <span>− {STREAK_DAYS}d</span><span>HOJE</span>
          </div>
        </div>
      </div>
    </div>
  )
}
