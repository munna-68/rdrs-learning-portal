export default function ProgressBar({
  value = 0,
  className = '',
  heightClass = 'h-2',
  trackClass = 'bg-slate-200',
  fillClass = 'bg-accent-600',
  label,
}) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
  const percent = clamped * 100

  return (
    <div
      className={`w-full overflow-hidden rounded-full ${trackClass} ${heightClass} ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      aria-label={label}
    >
      <div
        className={`h-full rounded-full ${fillClass} transition-[width] duration-500 ease-out`}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
