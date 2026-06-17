// Minimal className-hjälpare (inget externt beroende)
// Filtrerar bort false/undefined/null och slår ihop strängar.
export function cn(...classes) {
  return classes.filter(Boolean).join(" ")
}