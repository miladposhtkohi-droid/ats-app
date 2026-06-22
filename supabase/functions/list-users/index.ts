import { requireAdmin } from "../_shared/auth.ts"
import { jsonResponse, errorResponse, handleOptions, serializeError } from "../_shared/cors.ts"

interface UserRow {
  id: string
  email: string | null
  role: string | null
}

/**
 * Hjälpfunktion: returnerar true om ett fel från auth.admin-verktygen beror
 * på fel/ogiltig service_role-nyckel. Detta är den i särklass vanligaste
 * orsaken till att list-users returnerar tomt/fel istället för användarlistan.
 */
function looksLikeKeyError(err: unknown): boolean {
  const s = serializeError(err).toLowerCase()
  return (
    s.includes("invalid api key") ||
    s.includes("invalid_api_key") ||
    s.includes("unauthorized") ||
    s.includes("401") ||
    s.includes("jwt") ||
    s.includes("permission denied") ||
    s.includes("apikey")
  )
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions()

  try {
    console.log("[list-users] Anrop mottaget, method:", req.method)

    const auth = await requireAdmin(req.headers.get("Authorization"))
    if (!auth.ok) return auth.response
    const { supabase } = auth

    // --- 1) Hämta alla auth-användare (paginerat, 1000/sida) ---
    const users: { id: string; email?: string }[] = []
    let page = 1
    // listUsers returnerar max 1000 per anrop i Supabase.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data: listData, error } = await supabase.auth.admin.listUsers({
        page,
        perPage: 1000,
      })

      if (error) {
        // Logga HELA fel-objektet (non-enumerable props syns via console).
        console.error("[list-users] listUsers fel-objekt (raw):", error)
        console.error("[list-users] listUsers misslyckades:", serializeError(error))

        if (looksLikeKeyError(error)) {
          return errorResponse(
            "Serverfel: SUPABASE_SERVICE_ROLE_KEY verkar vara ogiltig. " +
              "Detta är det vanligaste felet när list-users inte returnerar data. " +
              "Detaljer: " + serializeError(error),
            500
          )
        }

        return errorResponse(
          "Kunde inte hämta användare: " + serializeError(error),
          500
        )
      }

      const pageUsers = listData?.users ?? []
      if (pageUsers.length === 0) break

      for (const u of pageUsers) {
        users.push({ id: u.id, email: u.email })
      }

      if (pageUsers.length < 1000) break
      page += 1
    }

    console.log("[list-users] Hämtade", users.length, "auth-användare")

    // --- 2) Hämta alla profiler ---
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")

    if (profileError) {
      console.error("[list-users] profiles fel-objekt (raw):", profileError)
      console.error(
        "[list-users] profiles-fråga misslyckades:",
        serializeError(profileError)
      )
      return errorResponse(
        "Kunde inte hämta profiler: " + serializeError(profileError),
        500
      )
    }

    console.log("[list-users] Hämtade", profiles?.length ?? 0, "profiler")

    const profileMap = new Map<string, string | null>(
      (profiles ?? []).map((p: { id: string; role: string | null }) => [
        p.id,
        p.role,
      ])
    )

    // --- 3) Slå ihop ---
    const result: UserRow[] = users.map((u) => ({
      id: u.id,
      email: u.email ?? null,
      role: profileMap.get(u.id) ?? null,
    }))

    console.log("[list-users] Returnerar", result.length, "rader")

    // VIKTIGT: Admin.jsx läser data.users – nyckeln MÅSTE heta "users".
    // Vi returnerar ALLTID formen { success, users: [...] } även om listan
    // är tom, så att frontend aldrig får "{}" eller undefined.
    return jsonResponse({ success: true, users: result, count: result.length })
  } catch (err) {
    console.error("[list-users] Oväntat fel (raw error-objekt):", err)
    console.error("[list-users] Oväntat fel (serialiserat):", serializeError(err))
    if (err instanceof Error && err.stack) {
      console.error("[list-users] Stack trace:", err.stack)
    }
    return errorResponse("Serverfel: " + serializeError(err), 500)
  }
})