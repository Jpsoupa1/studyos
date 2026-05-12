import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, ChevronRight, Zap } from 'lucide-react'
import { connectGoogle } from '@/services/google'

interface Props {
  onDone: () => void
}

export default function CalendarSetup({ onDone }: Props) {
  const [connecting, setConnecting] = useState(false)
  const [error,      setError]      = useState('')

  const hasClientId = !!import.meta.env.VITE_GOOGLE_CLIENT_ID

  const handleConnect = () => {
    if (!hasClientId) { setError('VITE_GOOGLE_CLIENT_ID não configurado.'); return }
    if (!window.google?.accounts?.oauth2) { setError('Google Identity Services ainda não carregou. Aguarde e tente novamente.'); return }

    setConnecting(true)
    setError('')
    connectGoogle((token) => {
      if (token) onDone()
      else { setConnecting(false); setError('Conexão cancelada ou falhou. Tente novamente.') }
    })
    // connectGoogle abre popup síncrono — se o usuário cancelar, o callback não dispara
    // Após 30s sem resposta, libera o botão
    setTimeout(() => setConnecting(false), 30_000)
  }

  const handleSkip = () => {
    sessionStorage.setItem('cal-setup-skipped', '1')
    onDone()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm flex flex-col items-center gap-6"
      >
        {/* Ícone */}
        <div style={{
          width: 72, height: 72, borderRadius: 18,
          background: 'var(--bg-2)', border: '1px solid var(--line)',
          display: 'grid', placeItems: 'center',
        }}>
          <Calendar size={32} color="var(--blue)" />
        </div>

        {/* Texto */}
        <div className="text-center flex flex-col gap-2">
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--text-1)' }}>
            Conectar Google Agenda
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 280 }}>
            Sincronize suas tarefas e lembretes automaticamente com o Google Calendar.
          </p>
        </div>

        {/* Benefícios */}
        <div className="tile w-full" style={{ padding: '1rem' }}>
          <div className="flex flex-col gap-3">
            {[
              { icon: '📅', text: 'Tarefas criadas no app aparecem no Calendar' },
              { icon: '🔄', text: 'Alterações no Calendar atualizam o app em 30s' },
              { icon: '🔔', text: 'Lembretes sincronizados como eventos' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div style={{ width: '100%', padding: '8px 12px', background: 'var(--red-soft)', border: '1px solid var(--red)', borderRadius: 8 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--red)', letterSpacing: '0.04em' }}>⚠ {error}</p>
          </div>
        )}

        {/* Botões */}
        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={handleConnect}
            disabled={connecting}
            style={{
              width: '100%', padding: '11px', borderRadius: 8,
              background: connecting ? 'var(--bg-2)' : 'var(--blue)',
              color: connecting ? 'var(--text-3)' : '#fff',
              border: `1px solid ${connecting ? 'var(--line)' : 'var(--blue)'}`,
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              cursor: connecting ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.15s',
            }}
          >
            <Zap size={13} />
            {connecting ? 'Aguardando autorização...' : 'Conectar Google Agenda'}
          </button>

          <button
            onClick={handleSkip}
            style={{
              width: '100%', padding: '10px', borderRadius: 8,
              background: 'transparent', color: 'var(--text-4)',
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 10,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}
          >
            Continuar sem conectar <ChevronRight size={11} />
          </button>
        </div>

        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-4)', textAlign: 'center' }}>
          Você pode conectar mais tarde em Config → Google Agenda
        </p>
      </motion.div>
    </div>
  )
}
