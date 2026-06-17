import { cn } from "../../lib/cn"

// Egen logotyp för ATS-appen – ett "Iris"-märke
// (indigo/violet-gradient med en stiliserad flödesikon)
export default function Logo({ className, showText = true }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-xl",
          "bg-gradient-to-br from-brand-500 to-accent-500 shadow-md shadow-brand-500/30"
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5 text-white"
          aria-hidden="true"
        >
          <path
            d="M4 6h4M4 12h7M4 18h10M16 6h4M14 12h6M17 18h3"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {showText && (
        <span className="font-display text-lg font-extrabold tracking-tight text-ink">
          Iris<span className="text-brand-600">ATS</span>
        </span>
      )}
    </div>
  )
}