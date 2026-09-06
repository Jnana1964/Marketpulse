export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)]/50 px-6 py-14 text-center">
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-[var(--color-text-secondary)]">
          <Icon size={22} />
        </span>
      )}
      <p className="text-base font-semibold text-white">{title}</p>
      {description && <p className="max-w-sm text-sm text-[var(--color-text-secondary)]">{description}</p>}
      {action}
    </div>
  );
}
