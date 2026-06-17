// ============================================================
// Statuskonfiguration – enda källan till sanning för Kanban-statusar
// Används av: Kanban-kolumner, CandidateCard, StatusBadge, Candidates-lista
// Säkerställer konsekvent färgkodning i hela appen.
// ============================================================

export const STATUSES = [
  {
    key: "new",
    label: "Nya",
    description: "Nya sökande",
    // CSS-klasser för olika sammanhang
    badge: "bg-[var(--color-status-new-bg)] text-[var(--color-status-new-text)] border-[var(--color-status-new-border)]",
    dot: "bg-[var(--color-status-new-accent)]",
    column: "bg-[var(--color-status-new-bg)]",
    columnBorder: "border-t-[var(--color-status-new-accent)]",
    accent: "var(--color-status-new-accent)",
    soft: "bg-[var(--color-status-new-bg)] text-[var(--color-status-new-text)]",
  },
  {
    key: "screening",
    label: "Screening",
    description: "Under bedömning",
    badge: "bg-[var(--color-status-screening-bg)] text-[var(--color-status-screening-text)] border-[var(--color-status-screening-border)]",
    dot: "bg-[var(--color-status-screening-accent)]",
    column: "bg-[var(--color-status-screening-bg)]",
    columnBorder: "border-t-[var(--color-status-screening-accent)]",
    accent: "var(--color-status-screening-accent)",
    soft: "bg-[var(--color-status-screening-bg)] text-[var(--color-status-screening-text)]",
  },
  {
    key: "interview",
    label: "Intervju",
    description: "Kallad till intervju",
    badge: "bg-[var(--color-status-interview-bg)] text-[var(--color-status-interview-text)] border-[var(--color-status-interview-border)]",
    dot: "bg-[var(--color-status-interview-accent)]",
    column: "bg-[var(--color-status-interview-bg)]",
    columnBorder: "border-t-[var(--color-status-interview-accent)]",
    accent: "var(--color-status-interview-accent)",
    soft: "bg-[var(--color-status-interview-bg)] text-[var(--color-status-interview-text)]",
  },
  {
    key: "offer",
    label: "Erbjudande",
    description: "Jobberbjudande skickat",
    badge: "bg-[var(--color-status-offer-bg)] text-[var(--color-status-offer-text)] border-[var(--color-status-offer-border)]",
    dot: "bg-[var(--color-status-offer-accent)]",
    column: "bg-[var(--color-status-offer-bg)]",
    columnBorder: "border-t-[var(--color-status-offer-accent)]",
    accent: "var(--color-status-offer-accent)",
    soft: "bg-[var(--color-status-offer-bg)] text-[var(--color-status-offer-text)]",
  },
  {
    key: "rejected",
    label: "Avslag",
    description: "Ej aktuella",
    badge: "bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected-text)] border-[var(--color-status-rejected-border)]",
    dot: "bg-[var(--color-status-rejected-accent)]",
    column: "bg-[var(--color-status-rejected-bg)]",
    columnBorder: "border-t-[var(--color-status-rejected-accent)]",
    accent: "var(--color-status-rejected-accent)",
    soft: "bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected-text)]",
  },
]

// Snabbsök: key -> statusobjekt
export const STATUS_MAP = STATUSES.reduce((acc, s) => {
  acc[s.key] = s
  return acc
}, {})

// Hämta status-objekt med fallback till "new"
export function getStatus(key) {
  return STATUS_MAP[key] || STATUS_MAP.new
}

// Initialer för avatar (t.ex. "Anna Berg" -> "AB")
export function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}