import { cn } from "../../lib/cn"

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-surface shadow-soft",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }) {
  return (
    <div className={cn("px-5 py-4 border-b border-line", className)}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children }) {
  return (
    <h3 className={cn("font-semibold text-ink", className)}>{children}</h3>
  )
}

export function CardDescription({ className, children }) {
  return (
    <p className={cn("text-sm text-ink-muted mt-0.5", className)}>{children}</p>
  )
}

export function CardContent({ className, children }) {
  return <div className={cn("p-5", className)}>{children}</div>
}

export function CardFooter({ className, children }) {
  return (
    <div
      className={cn(
        "px-5 py-3 border-t border-line bg-muted/50 rounded-b-xl",
        className
      )}
    >
      {children}
    </div>
  )
}