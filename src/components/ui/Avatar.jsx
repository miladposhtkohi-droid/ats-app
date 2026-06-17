import { cn } from "../../lib/cn"
import { getInitials } from "../../lib/statuses"

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
}

// Avatar med initialer – färg baseras på namn (deterministisk)
// så samma person alltid får samma färg.
const GRADIENTS = [
  "from-brand-500 to-accent-500",
  "from-sky-500 to-brand-500",
  "from-violet-500 to-fuchsia-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-indigo-500 to-blue-500",
  "from-cyan-500 to-brand-500",
]

function pickGradient(name = "") {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

export default function Avatar({ name, size = "md", className }) {
  const initials = getInitials(name) || "?"
  const gradient = pickGradient(name)

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        "bg-gradient-to-br text-white font-semibold shadow-sm select-none",
        gradient,
        SIZES[size],
        className
      )}
      title={name}
    >
      {initials}
    </span>
  )
}