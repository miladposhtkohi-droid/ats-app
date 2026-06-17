import { cn } from "../../lib/cn"

export default function Textarea({ className, rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      className={cn(
        "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink",
        "placeholder:text-ink-muted/70",
        "shadow-sm transition-colors duration-150 resize-y min-h-[80px]",
        "focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10",
        "disabled:opacity-50 disabled:bg-muted",
        className
      )}
      {...props}
    />
  )
}