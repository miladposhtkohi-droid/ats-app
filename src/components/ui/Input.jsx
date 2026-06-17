import { cn } from "../../lib/cn"

const SIZES = {
  sm: "h-9 text-sm",
  md: "h-10 text-sm",
  lg: "h-11 text-base",
}

export default function Input({ size = "md", className, ...props }) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-line bg-white px-3.5 text-ink",
        "placeholder:text-ink-muted/70",
        "shadow-sm transition-colors duration-150",
        "focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10",
        "disabled:opacity-50 disabled:bg-muted",
        SIZES[size],
        className
      )}
      {...props}
    />
  )
}