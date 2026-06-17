import { cn } from "../../lib/cn"

// PageHeader – konsekvent sidhuvud med titel, undertext och åtgärder
export function PageHeader({ title, subtitle, actions, icon, className }) {
  return (
    <div className={cn("mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex items-start gap-3">
        {icon && (
          <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            {icon}
          </span>
        )}
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

// EmptyState – när listor saknar innehåll
export function EmptyState({ title, description, icon, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface/50 px-6 py-12 text-center",
        className
      )}
    >
      {icon && (
        <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
          {icon}
        </span>
      )}
      <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// Spinner
export function Spinner({ className }) {
  return (
    <svg
      className={cn("h-5 w-5 animate-spin text-brand-500", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// LoadingState – centrerad spinner med text
export function LoadingState({ label = "Laddar...", className }) {
  return (
    <div className={cn("flex items-center justify-center gap-3 py-16 text-ink-muted", className)}>
      <Spinner />
      <span className="text-sm">{label}</span>
    </div>
  )
}