export function SkeletonCard() {
  return (
    <div className="rounded-2xl p-6 glass-panel card-hover relative overflow-hidden">
      <div className="flex items-center gap-4 mb-6">
        <div className="skeleton rounded-full w-14 h-14" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-5 w-32 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
      </div>
      <div className="flex items-center gap-6 mb-6">
        <div className="skeleton rounded-full w-28 h-28" />
        <div className="flex-1 space-y-3">
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-4 w-5/6 rounded" />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton h-6 w-16 rounded-full" />
        ))}
      </div>
    </div>
  )
}
