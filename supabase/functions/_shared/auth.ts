import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { errorResponse, serializeError } from "./cors.ts"

/**
 * Skapar en Supabase-klient med service_role – körs ENDAST på servern (Edge Function).
 * service_role-nyckeln exponeras aldrig i frontend.
 */
export function adminClient() {
  const url = Deno.env.get("SUPABASE_URL")
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !key) {
    console.error("[auth] Saknar SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY")
  }
  return createClient(url ?? "", key ?? "", {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export type AdminContext = {
  ok: true
  user: { id: string; email?: string; role?: string }
  supabase: ReturnType<typeof adminClient>
}
export type AdminDenied = { ok: false; response: Response }
export type AdminResult = AdminContext | AdminDenied

/**
 * Verifierar att anroparen är inloggad OCH har profiles.role = 'admin'.
 * Returnerar { ok: true, user, supabase } eller { ok: false, response }.
 *
 * `authHeader` = värdet från "Authorization"-headern (t.ex. "Bearer eyJ...").
 */
export async function requireAdmin(authHeader: string | null): Promise<AdminResult> {
  console.log("[auth] requireAdmin start, header finns:", Boolean(authHeader))

  if (!authHeader) {
    console.warn("[auth] Saknar Authorization-header")
    return { ok: false, response: errorResponse("Saknar Authorization-header", 401) }
  }

  const supabase = adminClient()

  // Sätt anroparens JWT på klienten så getUser() validerar mot deras session.
  const token = authHeader.replace(/^Bearer\s+/i, "").trim()
  if (!token) {
    console.warn("[auth] Tom token efter 'Bearer '")
    return { ok: false, response: errorResponse("Ogiltig token", 401) }
  }

  // Hämta användaren via JWT. getUser() validerar signaturen mot Supabase.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    console.warn("[auth] getUser misslyckades:", serializeError(error))
    return { ok: false, response: errorResponse("Ogiltig session", 401) }
  }

  // Kontrollera rollen i profiles (äkta källa, inte user_metadata/app_metadata).
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError) {
    console.warn(
      "[auth] profiles-fråga misslyckades för user",
      user.id,
      ":",
      serializeError(profileError)
    )
    return { ok: false, response: errorResponse("Kunde inte verifiera profil", 403) }
  }

  if (!profile) {
    console.warn("[auth] Ingen profilrad hittades för user", user.id)
    return { ok: false, response: errorResponse("Kunde inte verifiera profil", 403) }
  }

  if (profile.role !== "admin") {
    console.warn("[auth] Roll hittades men är inte admin. Roll =", profile.role)
    return { ok: false, response: errorResponse("Endast admin har åtkomst", 403) }
  }

  console.log("[auth] OK – admin verifierad:", user.id, user.email)
  return { ok: true, user: { id: user.id, email: user.email, role: profile.role }, supabase }
}