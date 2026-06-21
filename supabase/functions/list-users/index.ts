import { requireAdmin } from "../_shared/auth.ts"
import { jsonResponse, errorResponse, handleOptions, serializeError } from "../_shared/cors.ts"

interface UserRow {
  id: string
  email: string | null
  role: string | null
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
      const {
        data: listData,
        error,
      } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })

      if (error) {
        console.error("[list-users] listUsers misslyckades:", serializeError(error))
        return errorResponse("Kunde inte hämta användare: " + serializeError(error), 500)
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
      console.error("[list-users] profiles-fråga misslyckades:", serializeError(profileError))
      return errorResponse("Kunde inte hämta profiler: " + serializeError(profileError), 500)
    }

    console.log("[list-users] Hämtade", profiles?.length ?? 0, "profiler")

    const profileMap = new Map<string, string | null>(
      (profiles ?? []).map((p: { id: string; role: string | null }) => [p.id, p.role])
    )

    // --- 3) Slå ihop ---
    const result: UserRow[] = users.map((u) => ({
      id: u.id,
      email: u.email ?? null,
      role: profileMap.get(u.id) ?? null,
    }))

    console.log("[list-users] Returnerar", result.length, "rader")

    // VIKTIGT: Admin.jsx läser data.users – nyckeln MÅSTE heta "users".
    return jsonResponse({ success: true, users: result })
  } catch (err) {
    console.error("[list-users] Oväntat fel:", serializeError(err))
    return errorResponse("Serverfel: " + serializeError(err), 500)
  }
})