export function ErrorCard({ username, error }: { username: string; error: string }) {
  return (
    <div
      className="rounded-2xl p-6 glass-panel flex flex-col items-center justify-center gap-3 text-center"
      style={{
        borderColor: 'rgba(255,55,95,0.25)',
        minHeight: 160,
      }}
    >
      <div className="text-3xl">⚠️</div>
      <div>
        <div className="mono font-bold" style={{ color: 'var(--hard)' }}>@{username}</div>
        <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{error}</div>
      </div>
    </div>
  )
}
