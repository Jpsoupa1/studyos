import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'

const AVATAR_COLORS = ['#D9B26A', '#7AB58A', '#7B9BC7', '#9890C2', '#C77878', '#A8A8B8']

// ─── Logo ─────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <img src="/icons.svg" alt="Study OS" width="110" height="110"
      style={{ objectFit: 'contain', filter: 'drop-shadow(0 6px 20px rgba(45,139,106,0.40))' }} />
  )
}

// ─── Campo de input reutilizável ───────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, autoFocus }: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: 5 }}>
        {label}
      </label>
      <input
        type={type} value={value} autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', background: 'var(--bg-2)', color: 'var(--text-1)',
          border: `1px solid ${focused ? 'var(--amber)' : 'var(--line)'}`,
          borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none',
          fontFamily: 'var(--font-body)', transition: 'border-color 0.12s',
        }}
      />
    </div>
  )
}

// ─── Formulário de login ───────────────────────────────────────────────────
function SignInForm({ onSwitch }: { onSwitch: () => void }) {
  const { signIn, loading, error, clearError } = useAuthStore()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [resent,   setResent]   = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) return
    clearError()
    await signIn(email, password)
  }

  const resendConfirmation = async () => {
    await import('@/lib/supabase').then(({ supabase }) =>
      supabase.auth.resend({ type: 'signup', email: email.trim() })
    )
    setResent(true)
  }

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') void handleSubmit() }
  const needsConfirm = error.includes('Confirme')

  return (
    <motion.div key="signin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-4">
      <Field label="E-mail" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" autoFocus />
      <div onKeyDown={handleKey}>
        <Field label="Senha" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
      </div>

      {error && (
        <div style={{ padding: '10px 12px', background: 'var(--red-soft)', border: '1px solid var(--red)', borderRadius: 8 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--red)', letterSpacing: '0.04em' }}>
            ⚠ {error}
          </p>
          {needsConfirm && !resent && email && (
            <button onClick={() => void resendConfirmation()}
              style={{ marginTop: 6, fontSize: 11, color: 'var(--amber)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
              Reenviar e-mail de confirmação
            </button>
          )}
          {needsConfirm && resent && (
            <p style={{ marginTop: 6, fontSize: 11, color: 'var(--green)' }}>✓ E-mail reenviado. Verifique sua caixa de entrada.</p>
          )}
        </div>
      )}

      <button
        onClick={() => void handleSubmit()}
        disabled={loading || !email || !password}
        style={{
          width: '100%', padding: '10px', borderRadius: 8,
          background: 'var(--amber)', color: '#0E0E14', border: 'none',
          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          cursor: (loading || !email || !password) ? 'not-allowed' : 'pointer',
          opacity: (loading || !email || !password) ? 0.5 : 1,
          transition: 'opacity 0.12s',
        }}
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }}>
        Não tem conta?{' '}
        <button onClick={onSwitch} style={{ color: 'var(--amber)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>
          Cadastrar
        </button>
      </p>
    </motion.div>
  )
}

// ─── Formulário de cadastro ────────────────────────────────────────────────
function SignUpForm({ onSwitch }: { onSwitch: () => void }) {
  const { signUp, loading, error, clearError } = useAuthStore()

  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [name,        setName]        = useState('')
  const [course,      setCourse]      = useState('')
  const [institution, setInstitution] = useState('')
  const [semester,    setSemester]    = useState('')
  const [color,       setColor]       = useState(AVATAR_COLORS[0])
  const [step,        setStep]        = useState<'credentials' | 'profile'>('credentials')

  const goToProfile = () => {
    if (!email || !password || password.length < 6) return
    clearError()
    setStep('profile')
  }

  const handleSubmit = async () => {
    if (!name.trim()) return
    clearError()
    const res = await signUp({ email, password, name: name.trim(), course, institution, semester, avatarColor: color })
    if (res?.requireEmailConfirm) {
      alert("Conta criada com sucesso! Um email de confirmação foi enviado. Por favor, verifique sua caixa de entrada e confirme seu email antes de fazer login.")
      onSwitch()
    }
  }

  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

  return (
    <motion.div key="signup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-4">

      <AnimatePresence mode="wait">
        {step === 'credentials' ? (
          <motion.div key="creds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">
            <Field label="E-mail" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" autoFocus />
            <Field label="Senha (mín. 6 caracteres)" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
            <button
              onClick={goToProfile}
              disabled={!email || password.length < 6}
              style={{
                width: '100%', padding: '10px', borderRadius: 8,
                background: 'var(--amber)', color: '#0E0E14', border: 'none',
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                cursor: (!email || password.length < 6) ? 'not-allowed' : 'pointer',
                opacity: (!email || password.length < 6) ? 0.4 : 1,
              }}
            >
              Próximo →
            </button>
          </motion.div>
        ) : (
          <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4">
            {/* Avatar preview + color picker */}
            <div className="flex items-center gap-4">
              <div style={{
                width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                display: 'grid', placeItems: 'center',
                background: color + '20', color,
                border: `2px solid ${color}50`,
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
              }}>
                {initials || '?'}
              </div>
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map((c) => (
                  <button key={c} onClick={() => setColor(c)}
                    style={{
                      width: 22, height: 22, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                      boxShadow: color === c ? `0 0 0 2px var(--surface), 0 0 0 3.5px ${c}` : 'none',
                      transform: color === c ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.12s',
                    }} />
                ))}
              </div>
            </div>

            <Field label="Nome *" value={name} onChange={setName} placeholder="Seu nome completo" autoFocus />

            <div className="grid grid-cols-2 gap-3">
              <Field label="Curso" value={course} onChange={setCourse} placeholder="Ex: CC" />
              <Field label="Semestre" value={semester} onChange={setSemester} placeholder="Ex: 3" />
            </div>

            <Field label="Instituição" value={institution} onChange={setInstitution} placeholder="Ex: UniCEUB" />

            {error && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--red)' }}>⚠ {error}</p>
            )}

            <div className="flex gap-2">
              <button onClick={() => setStep('credentials')}
                style={{
                  padding: '10px 16px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                  background: 'var(--bg-2)', color: 'var(--text-2)', border: '1px solid var(--line)',
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.1em',
                }}>
                ← Voltar
              </button>
              <button onClick={() => void handleSubmit()} disabled={loading || !name.trim()}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8,
                  background: 'var(--amber)', color: '#0E0E14', border: 'none',
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
                }}>
                {loading ? 'Criando...' : 'Criar conta'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }}>
        Já tem conta?{' '}
        <button onClick={onSwitch} style={{ color: 'var(--amber)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>
          Entrar
        </button>
      </p>
    </motion.div>
  )
}

// ─── Tela principal ────────────────────────────────────────────────────────
export default function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--bg)' }}>

      {/* Branding */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-4 mb-10">
        <Logo />
        <div className="text-center">
          <p className="page-title" style={{ fontSize: 26 }}>
            Study<span className="slash">/</span>OS
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-4)', marginTop: 6 }}>
            Sistema de Produtividade Acadêmica
          </p>
        </div>
      </motion.div>

      {/* Card */}
      <div className="w-full max-w-sm tile" style={{ padding: '1.75rem' }}>
        {/* Tabs */}
        <div className="pomo-tabs mb-6">
          <div className={`pomo-tab${mode === 'signin' ? ' active' : ''}`} onClick={() => setMode('signin')}>
            Entrar
          </div>
          <div className={`pomo-tab${mode === 'signup' ? ' active' : ''}`} onClick={() => setMode('signup')}>
            Cadastrar
          </div>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'signin'
            ? <SignInForm key="signin" onSwitch={() => setMode('signup')} />
            : <SignUpForm key="signup" onSwitch={() => setMode('signin')} />
          }
        </AnimatePresence>
      </div>

    </div>
  )
}
