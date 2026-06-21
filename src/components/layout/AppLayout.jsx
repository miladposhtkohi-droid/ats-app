import { cn } from "../../lib/cn"
import Logo from "../ui/Logo"
import { Badge } from "../ui/Badge"
import Avatar from "../ui/Avatar"
import Button from "../ui/Button"

// AppLayout – konsekvent skal för hela den inloggade appen.
// Topbar med logo, nav (Jobb/Kanban), användarinfo och utloggning.
// Responsiv: på mobil blir topbar-en en rad; nav blir ikon-knappar.
export default function AppLayout({
  email,
  role,
  view,
  onViewChange,
  onSignOut,
  children,
}) {
  const navItems = [
    { key: "jobs", label: "Jobb", icon: JobsIcon },
    { key: "kanban", label: "Kanban", icon: KanbanIcon },
    ...(role === "admin"
      ? [{ key: "admin", label: "Admin", icon: ShieldIcon }]
      : []),
  ]

  return (
    <div className="min-h-screen bg-canvas">
      {/* ---- Topbar ---- */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Vänster: logo + nav */}
          <div className="flex items-center gap-6">
            <Logo />
            <nav className="hidden items-center gap-1 sm:flex">
              {navItems.map((item) => {
                const active = view === item.key
                const Icon = item.icon
                return (
                  <button
                    key={item.key}
                    onClick={() => onViewChange(item.key)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-ink-muted hover:bg-muted hover:text-ink"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Höger: användare + utloggning */}
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2.5 md:flex">
              <Avatar name={email} size="sm" />
              <div className="flex flex-col leading-tight">
                <span className="max-w-[180px] truncate text-sm font-medium text-ink">
                  {email}
                </span>
                <Badge
                  tone={role === "admin" ? "brand" : "neutral"}
                  className="mt-0.5 w-fit capitalize"
                >
                  {role || "okänd"}
                </Badge>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={onSignOut}
              className="gap-1.5"
            >
              <LogoutIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Logga ut</span>
            </Button>
          </div>
        </div>

        {/* Mobil-nav (under topbar) */}
        <nav className="flex items-center gap-1 border-t border-line px-4 py-2 sm:hidden">
          {navItems.map((item) => {
            const active = view === item.key
            const Icon = item.icon
            return (
              <button
                key={item.key}
                onClick={() => onViewChange(item.key)}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-muted hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}
        </nav>
      </header>

      {/* ---- Innehåll ---- */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>
    </div>
  )
}

/* ---- Ikoner (inline SVG, inget beroende) ---- */
function JobsIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M20 7H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1ZM8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M4 12h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function KanbanIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="3" width="5" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="9.5" y="3" width="5" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="16" y="3" width="5" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function LogoutIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M15 12H4m0 0 3-3m-3 3 3 3M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ShieldIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
