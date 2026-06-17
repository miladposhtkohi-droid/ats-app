import { useState } from "react"
import { supabase } from "../supabaseClient"
import Logo from "../components/ui/Logo"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import { Spinner } from "../components/ui/Page"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* ---- Vänster: varumärkespanel (dold på mobil) ---- */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600 lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Dekorativa ljuscirklar */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-accent-400/20 blur-3xl" />
        <div className="pointer-events-none absolute right-10 top-1/3 h-40 w-40 rounded-full bg-brand-300/20 blur-2xl" />

        {/* Logotyp i vitt */}
        <div className="relative flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" aria-hidden="true">
              <path d="M4 6h4M4 12h7M4 18h10M16 6h4M14 12h6M17 18h3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-white">
            Iris<span className="text-brand-200">ATS</span>
          </span>
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-extrabold leading-tight text-white">
            Hitta rätt person – enklare än någonsin.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-brand-100">
            IrisATS samlar dina rekryteringar, kandidater och statusflöden på
            ett ställe. Tydligare process, bättre beslut.
          </p>

          {/* Statistikpiller */}
          <div className="mt-8 flex gap-6">
            <div>
              <p className="font-display text-2xl font-bold text-white">5</p>
              <p className="text-xs text-brand-200">Statussteg</p>
            </div>
            <div className="border-l border-white/20 pl-6">
              <p className="font-display text-2xl font-bold text-white">1</p>
              <p className="text-xs text-brand-200">Vy för allt</p>
            </div>
            <div className="border-l border-white/20 pl-6">
              <p className="font-display text-2xl font-bold text-white">∞</p>
              <p className="text-xs text-brand-200">Kandidater</p>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-brand-200">
          © {new Date().getFullYear()} IrisATS. Alla rättigheter förbehållna.
        </p>
      </div>

      {/* ---- Höger: inloggningsformulär ---- */}
      <div className="flex w-full flex-col justify-center px-5 py-12 sm:px-8 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobil-logotyp */}
          <div className="mb-10 flex justify-center lg:hidden">
            <Logo />
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
              Välkommen tillbaka
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Logga in för att fortsätta hantera dina rekryteringar.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-ink-soft">
                E-postadress
              </label>
              <Input
                id="email"
                type="email"
                placeholder="namn@foretag.se"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-ink-soft">
                Lösenord
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-4 w-4 shrink-0">
                  <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Spinner className="h-4 w-4 text-white" />
                  Loggar in...
                </>
              ) : (
                "Logga in"
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-ink-muted">
            Har du inget konto? Kontakta din administratör.
          </p>
        </div>
      </div>
    </div>
  )
}