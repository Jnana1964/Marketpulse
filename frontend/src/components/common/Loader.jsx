/** Skeleton loading primitives — spec explicitly asks for skeletons over "Loading..." text (section 37). */
export function SkeletonLine({ width = '100%', height = '0.9rem', className = '' }) {
  return (
    <div
      className={`animate-pulse rounded bg-white/[0.06] ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 ${className}`}>
      <SkeletonLine width="40%" height="0.75rem" className="mb-3" />
      <SkeletonLine width="70%" height="1.5rem" className="mb-2" />
      <SkeletonLine width="55%" height="0.75rem" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
      <SkeletonLine width="30%" />
      <SkeletonLine width="15%" />
      <SkeletonLine width="15%" />
      <SkeletonLine width="15%" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}
