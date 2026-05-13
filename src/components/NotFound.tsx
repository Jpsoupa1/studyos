import { useNavigate, useLocation } from 'react-router-dom'

export default function NotFound() {
  const navigate  = useNavigate()
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6"
      style={{ background: 'var(--bg)' }}>
      <img src="/icons.svg" alt="Study OS" width="72" height="72"
        style={{ objectFit: 'contain', opacity: 0.5 }} />

      <div className="text-center flex flex-col gap-2">
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-4)' }}>
          404 · Página não encontrada
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: 'var(--text-1)', marginTop: 4 }}>
          Essa rota não existe
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
          <span style={{ color: 'var(--amber)' }}>{pathname}</span> não é uma página do Study OS.
        </p>
      </div>

      <button
        onClick={() => navigate('/painel', { replace: true })}
        style={{
          padding: '10px 24px', borderRadius: 8,
          background: 'var(--green)', color: '#fff',
          border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-mono)', fontSize: 11,
          fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>
        Voltar ao painel
      </button>
    </div>
  )
}
