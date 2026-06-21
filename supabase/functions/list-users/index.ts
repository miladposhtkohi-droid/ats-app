import { requireAdmin } from "../_shared/auth.ts"
import { jsonResponse, errorResponse } from "../_shared/cors.ts"

interface UserRow {
  id: string
  email: string | null
  role: string | null
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    })
  }

  try {
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
        data: { users: pageUsers },
        error,
      } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })

      if (error) {
        return errorResponse("Kunde inte hämta användare: " + error.message, 500)
      }

      if (!pageUsers || pageUsers.length === 0) break

      for (const u of pageUsers) {
        users.push({ id: u.id, email: u.email })
      }

      if (pageUsers.length < 1000) break
      page += 1
    }

    // --- 2) Hämta alla profiler ---
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")

    if (profileError) {
      return errorResponse("Kunde inte hämta profiler: " + profileError.message, 500)
    }

    const profileMap = new Map<string, string | null>(
      (profiles ?? []).map((p: { id: string; role: string | null }) => [p.id, p.role])
    )

    // --- 3) Slå ihop ---
    const result: UserRow[] = users.map((u) => ({
      id: u.id,
      email: u.email ?? null,
      role: profileMap.get(u.id) ?? null,
    }))

    return jsonResponse({ success: true, users: result })
  } catch (err) {
    return errorResponse("Serverfel: " + String(err), 500)
  }
})