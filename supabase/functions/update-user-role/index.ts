import { requireAdmin } from "../_shared/auth.ts"
import { jsonResponse, errorResponse } from "../_shared/cors.ts"

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

    const { userId, role } = await req.json()

    // --- Validering ---
    if (!userId || !role) {
      return errorResponse("userId och role krävs", 400)
    }
    if (!["admin", "customer"].includes(role)) {
      return errorResponse("role måste vara 'admin' eller 'customer'", 400)
    }

    // --- 1) Uppdatera profiles.role ---
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId)

    if (profileError) {
      return errorResponse("Kunde inte uppdatera profil: " + profileError.message, 500)
    }

    // --- 2) Uppdatera user_metadata.role i auth.users ---
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role },
    })

    if (authError) {
      return errorResponse("Kunde inte uppdatera auth-användare: " + authError.message, 500)
    }

    return jsonResponse({ success: true })
  } catch (err) {
    return errorResponse("Serverfel: " + String(err), 500)
  }
})