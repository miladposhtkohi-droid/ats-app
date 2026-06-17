import { cn } from "../../lib/cn"
import { getStatus } from "../../lib/statuses"

// Generisk Badge – används för roller, etiketter etc.
const BADGE_TONES = {
  neutral: "bg-muted text-ink-soft border-line",
  brand: "bg-brand-50 text-brand-700 border-brand-100",
  success: "bg-emerald-50 text-emerald-700 border-emerald-100",
  warning: "bg-amber-50 text-amber-700 border-amber-100",
  danger: "bg-red-50 text-red-700 border-red-100",
}

export function Badge({ tone = "neutral", className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
        "text-xs font-medium",
        BADGE_TONES[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

// StatusBadge – färgkodad efter kandidatens status
export function StatusBadge({ status, className }) {
  const s = getStatus(status)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
        "text-xs font-medium",
        s.badge,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  )
}