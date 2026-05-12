import { useState } from 'react'
import { motion } from 'framer-motion'
import { Key, User, Calendar } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { connectGoogle, getToken, clearToken, clearCalendarSyncToken } from '@/services/google'
import Button from './ui/Button'

export default function Settings() {
  const { user, updateProfile } = useAuthStore()
  const [name,        setName]        = useState(user?.name        ?? '')
  const [course,      setCourse]      = useState(user?.course      ?? '')
  const [institution, setInstitution] = useState(user?.institution ?? '')
  const [semester,    setSemester]    = useState(user?.semester    ?? '')
  const [saved,       setSaved]       = useState(false)
  const [googleToken, setGoogleToken] = useState<string | null>(getToken())

  const saveProfile = async () => {
    await updateProfile({ name, course, institution, semester })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleGoogleConnect = () => {
    connectGoogle((token) => setGoogleToken(token))
  }

  const handleGoogleDisconnect = () => {
    clearToken()
    clearCalendarSyncToken()
    setGoogleToken(null)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg-2)', color: 'var(--text-1)',
    border: '1px solid var(--line)', borderRadius: 8,
    padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)',
  }

  return (
    <div className="flex flex-col gap-4 w-full" style={{ maxWidth: 520 }}>

      {/* Perfil */}
      <div className="tile" style={{ padding: '1.25rem' }}>
        <div className="flex items-center gap-2 mb-4">
          <User size={15} style={{ color: 'var(--amber)' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>Perfil</h3>
        </div>

        <div className="flex flex-col gap-3">
          {([
            { label: 'Nome',         value: name,        set: setName,        placeholder: 'Seu nome' },
            { label: 'Curso',        value: course,      set: setCourse,      placeholder: 'Ex: Ciência da Computação' },
            { label: 'Instituição',  value: institution, set: setInstitution, placeholder: 'Ex: UniCEUB' },
            { label: 'Semestre',     value: semester,    set: setSemester,    placeholder: 'Ex: 3' },
          ] as const).map(({ label, value, set, placeholder }) => (
            <div key={label}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: 5 }}>
                {label}
              </label>
              <input value={value} onChange={(e) => (set as (v: string) => void)(e.target.value)}
                placeholder={placeholder} style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'var(--amber)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--line)')} />
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <motion.div animate={{ scale: saved ? 1.04 : 1 }}>
              <Button variant="primary" size="sm" onClick={() => void saveProfile()}>
                {saved ? '✓ Salvo!' : 'Salvar perfil'}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Google Calendar */}
      <div className="tile" style={{ padding: '1.25rem' }}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={15} style={{ color: 'var(--blue)' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>Google Calendar</h3>
        </div>

        {googleToken ? (
          <div className="flex flex-col gap-3">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--green-soft)', border: '1px solid var(--green)', borderRadius: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--green)' }}>Conectado ao Google Calendar</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleGoogleDisconnect}>
              Desconectar
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
              Conecte o Google Calendar para sincronizar tarefas e lembretes automaticamente.
            </p>
            <div style={{ padding: '8px 12px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: 4 }}>
                Variável necessária no .env.local
              </p>
              <code style={{ fontSize: 11, color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>VITE_GOOGLE_CLIENT_ID=*.apps.googleusercontent.com</code>
            </div>
            <Button variant="primary" size="sm" onClick={handleGoogleConnect}>
              Conectar Google Calendar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
