import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * Skapar en Supabase-klient med service_role – körs ENDAST på servern (Edge Function).
 * service_role-nyckeln exponeras aldrig i frontend.
 */
export function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

/**
 * Verifierar att anroparen är inloggad OCH har profiles.role = 'admin'.
 * Returnar { ok: true, user, supabase } eller { ok: false, response }.
 *
 * `authHeader` = värdet från "Authorization"-headern (t.ex. "Bearer eyJ...").
 */
export async function requireAdmin(authHeader: string | null) {
  if (!authHeader) {
    return {
      ok: false as const,
      response: jsonError("Saknar Authorization-header", 401),
    }
  }

  const supabase = adminClient()

  // Sätt anroparens JWT på klienten så getUser() validerar mot deras session.
  const token = authHeader.replace("Bearer ", "")
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    return {
      ok: false as const,
      response: jsonError("Ogiltig session", 401),
    }
  }

  // Kontrollera rollen i profiles.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return {
      ok: false as const,
      response: jsonError("Kunde inte verifiera profil", 403),
    }
  }

  if (profile.role !== "admin") {
    return {
      ok: false as const,
      response: jsonError("Endast admin har åtkomst", 403),
    }
  }

  return { ok: true as const, user, supabase }
}

// Alias för att slippa importera både detta och cors.ts i varje fil.
function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
  })
}