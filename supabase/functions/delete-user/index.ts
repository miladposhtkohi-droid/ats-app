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
    const { user: caller, supabase } = auth

    const { userId } = await req.json()

    if (!userId) {
      return errorResponse("userId krävs", 400)
    }

    // Skydd: en admin får inte radera sitt eget konto via denna funktion.
    if (userId === caller.id) {
      return errorResponse("Du kan inte ta bort ditt eget konto", 400)
    }

    // --- 1) Ta bort från auth.users (kaskad-borttagning sköter ofta profiles via FK, men vi tar bort explicit också) ---
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)

    if (authError) {
      return errorResponse("Kunde inte ta bort auth-användare: " + authError.message, 500)
    }

    // --- 2) Ta bort från profiles (om kaskad inte är konfigurerat) ---
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId)

    // Vi är inte hårda på profileError här – auth-användaren är redan borttagen.
    if (profileError) {
      console.warn("profiles-delete misslyckades:", profileError.message)
    }

    return jsonResponse({ success: true })
  } catch (err) {
    return errorResponse("Serverfel: " + String(err), 500)
  }
})