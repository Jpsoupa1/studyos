export default function AICoach() {
  return (
    <div className="tile flex flex-col items-center justify-center" style={{ minHeight: 280, padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, marginBottom: 16, opacity: 0.3 }}>[ ]</div>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-1)', marginBottom: 8 }}>
        AXIS Coach
      </p>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-4)' }}>
        Em breve
      </p>
    </div>
  )
}
