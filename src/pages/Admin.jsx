import { useEffect, useState, useCallback } from "react"
import { supabase } from "../supabaseClient"
import {
  FunctionsHttpError,
  FunctionsRelayError,
  FunctionsFetchError,
} from "@supabase/supabase-js"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import { Card } from "../components/ui/Card"
import { Badge } from "../components/ui/Badge"
import { PageHeader, EmptyState, LoadingState } from "../components/ui/Page"

const ROLES = ["admin", "customer"]

/**
 * Helper runt supabase.functions.invoke med tydlig felhantering.
 *
 * Vanliga fel och vad de betyder:
 *  - FunctionsHttpError:  funktionen existerar inte (404) ELLER returnerade
 *                         ett fel (t.ex. 401/403). Läs error.context.json().
 *  - FunctionsRelayError: nätverks/relay-problem hos Supabase.
 *  - FunctionsFetchError: kunde inte nå Supabase överhuvudtaget (CORS/DNS).
 */
async function callFn(name, body) {
  console.log(`[Admin] invoke "${name}" med body:`, body)
  const { data, error } = await supabase.functions.invoke(name, {
    // invoke strängsätter automatiskt ett objekt, men vi är explicita
    // så att vi är 100% säkra på att Content-Type blir application/json.
    body: JSON.stringify(body),
    // invoke skickar automatiskt nuvarande sessions JWT om klienten är
    // inloggad, så Authorization-headern blir korrekt.
  })

  // Explicit loggning av båda fälten separat så det aldrig visas som "{}".
  console.log(`[Admin] svar från "${name}":`)
  console.log("  → data :", data)
  console.log("  → error:", error)
  // Vid FunctionsHttpError innehåller error.context det faktiska HTTP-svaret
  // (status + body). Logga det direkt så att man ser *vilket* fel Edge
  // Functionen returnerade – annars syns bara "FunctionsHttpError".
  if (error instanceof FunctionsHttpError && error.context) {
    console.warn(`[Admin] HTTP ${error.context.status} från "${name}".`)
    console.warn(
      "[Admin] Detta betyder att funktionen körs men returnerade ett fel.",
      "Kolla Edge Function-loggarna i Supabase Dashboard → Functions → Logs."
    )
  }

  if (error instanceof FunctionsHttpError) {
    // Försök läsa ut { error: "..." } från Edge Functionens svar.
    let detail = `${error.context.status} från "${name}"`
    try {
      const json = await error.context.json()
      detail = json.error || JSON.stringify(json)
    } catch {
      try {
        const text = await error.context.text()
        if (text) detail = text
      } catch {
        /* behåll status */
      }
    }
    // 404 = funktionen är inte deployad.
    if (error.context.status === 404) {
      detail = `Funktionen "${name}" finns inte på Supabase (404). ` +
        `Har du kört "supabase functions deploy ${name}"?`
    }
    throw new Error(detail)
  }

  if (error instanceof FunctionsRelayError) {
    throw new Error(`Relay-fel ("${name}"): ${error.message}`)
  }

  if (error instanceof FunctionsFetchError) {
    throw new Error(
      `Kunde inte nå Supabase ("${name}"): ${error.message}. ` +
        `Kontrollera VITE_SUPABASE_URL och nätverk/CORS.`
    )
  }

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export default function Admin({ session }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  // Formulär: skapa konto
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("customer")
  const [creating, setCreating] = useState(false)

  const currentUserId = session?.user?.id

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await callFn("list-users", {})
      setUsers(data.users ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Data fetching on mount – setState sker asynkront efter await, inte synkront.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers()
  }, [fetchUsers])

  async function handleCreate(e) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setCreating(true)
    try {
      await callFn("create-user", { email, password, role })
      setEmail("")
      setPassword("")
      setRole("customer")
      setInfo(`Konto skapat för ${email}.`)
      await fetchUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleRoleChange(userId, newRole) {
    setError(null)
    setInfo(null)
    try {
      await callFn("update-user-role", { userId, role: newRole })
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
      setInfo("Roll uppdaterad.")
    } catch (err) {
      setError(err.message)
      // Återställ select genom att tvinga omrendering med tidigare värde
      await fetchUsers()
    }
  }

  async function handleDelete(user) {
    setError(null)
    setInfo(null)
    const ok = window.confirm(
      `Ta bort konto "${user.email}"? Detta går inte att ångra.`
    )
    if (!ok) return
    try {
      await callFn("delete-user", { userId: user.id })
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      setInfo(`Konto ${user.email} borttaget.`)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Användarkonton"
        subtitle="Skapa, redigera och ta bort konton."
        icon={<ShieldIcon className="h-5 w-5" />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-8">
        {/* ---- Vänster: skapa konto ---- */}
        <div className="order-2 lg:order-1">
          <Card className="lg:sticky lg:top-24">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-display text-lg font-semibold text-ink">
                Skapa nytt konto
              </h2>
              <p className="mt-0.5 text-sm text-ink-muted">
                Kontot skapas i Supabase Auth och profiles.
              </p>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 p-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-ink-soft">
                  E-post
                </label>
                <Input
                  type="email"
                  placeholder="namn@foretag.se"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-ink-soft">
                  Lösenord
                </label>
                <Input
                  type="password"
                  placeholder="Minst 6 tecken"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-ink-soft">
                  Roll
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r === "admin" ? "Admin" : "Kund"}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}
              {info && !error && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
                  {info}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={creating}>
                <PlusIcon className="h-4 w-4" />
                {creating ? "Skapar..." : "Skapa konto"}
              </Button>
            </form>
          </Card>
        </div>

        {/* ---- Höger: användartabell ---- */}
        <div className="order-1 lg:order-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">
              Alla konton{" "}
              <span className="ml-1 text-sm font-normal text-ink-muted">
                ({users.length})
              </span>
            </h2>
            <Button variant="secondary" size="sm" onClick={fetchUsers}>
              Uppdatera
            </Button>
          </div>

          {loading ? (
            <LoadingState label="Hämtar konton..." />
          ) : users.length === 0 ? (
            <EmptyState
              icon={<UsersIcon className="h-7 w-7" />}
              title="Inga konton hittades"
              description="Det uppstod kanske ett problem vid hämtning."
            />
          ) : (
            <Card className="overflow-hidden">
              {/* Tabell (md+) */}
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      <th className="px-5 py-3">E-post</th>
                      <th className="px-5 py-3">Roll</th>
                      <th className="px-5 py-3 text-right">Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isSelf = u.id === currentUserId
                      return (
                        <tr
                          key={u.id}
                          className="border-b border-line last:border-0 hover:bg-muted/30"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-ink">
                                {u.email || "—"}
                              </span>
                              {isSelf && (
                                <Badge tone="neutral" className="capitalize">
                                  du
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <RoleSelect
                              value={u.role}
                              disabled={isSelf}
                              onChange={(newRole) =>
                                handleRoleChange(u.id, newRole)
                              }
                            />
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(u)}
                              disabled={isSelf}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <TrashIcon className="h-4 w-4" />
                              Ta bort
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Kortlista (mobil) */}
              <ul className="divide-y divide-line md:hidden">
                {users.map((u) => {
                  const isSelf = u.id === currentUserId
                  return (
                    <li key={u.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">
                            {u.email || "—"}
                          </p>
                          {isSelf && (
                            <Badge tone="neutral" className="mt-1 capitalize">
                              du
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(u)}
                          disabled={isSelf}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-3">
                        <RoleSelect
                          value={u.role}
                          disabled={isSelf}
                          onChange={(newRole) =>
                            handleRoleChange(u.id, newRole)
                          }
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---- Inline-rollväljare ---- */
function RoleSelect({ value, disabled, onChange }) {
  return (
    <div className="inline-flex items-center gap-2">
      <Badge tone={value === "admin" ? "brand" : "neutral"} className="capitalize">
        {value || "okänd"}
      </Badge>
      <select
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 rounded-md border border-line bg-white px-2 text-xs text-ink shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 disabled:opacity-50"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r === "admin" ? "Admin" : "Kund"}
          </option>
        ))}
      </select>
    </div>
  )
}

/* ---- Ikoner ---- */
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

function PlusIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function UsersIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TrashIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 7h16M10 11v6M14 11v6M5 7l1 13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}