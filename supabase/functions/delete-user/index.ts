import { requireAdmin } from "../_shared/auth.ts"
import { jsonResponse, errorResponse, handleOptions, serializeError } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions()

  try {
    console.log("[delete-user] Anrop mottaget, method:", req.method)

    const auth = await requireAdmin(req.headers.get("Authorization"))
    if (!auth.ok) return auth.response
    const { user: caller, supabase } = auth

    // --- Läs body ---
    let body: { userId?: unknown }
    try {
      body = await req.json()
    } catch (parseErr) {
      console.error("[delete-user] Kunde inte parsa JSON-body:", serializeError(parseErr))
      return errorResponse("Ogiltig JSON i body", 400)
    }

    const userId = typeof body.userId === "string" ? body.userId.trim() : ""

    console.log("[delete-user] Body mottagen:", {
      userId: userId || "(saknas)",
      callerId: caller.id,
    })

    if (!userId) {
      console.warn("[delete-user] userId saknas i body")
      return errorResponse("userId krävs", 400)
    }

    // Skydd: en admin får inte radera sitt eget konto via denna funktion.
    if (userId === caller.id) {
      console.warn("[delete-user] Admin försökte ta bort sitt eget konto:", caller.id)
      return errorResponse("Du kan inte ta bort ditt eget konto", 400)
    }

    // --- 1) Ta bort från auth.users ---
    console.log("[delete-user] Försöker ta bort auth-användare:", userId)
    const { data: deleteData, error: authError } = await supabase.auth.admin.deleteUser(userId)

    // Auth-fel (AuthError) har non-enumerable props → strängsätts annars till "{}".
    if (authError) {
      console.error(
        "[delete-user] deleteUser misslyckades för",
        userId,
        ":",
        serializeError(authError)
      )
      return errorResponse(
        "Kunde inte ta bort auth-användare: " + serializeError(authError),
        500
      )
    }

    console.log("[delete-user] Auth-användare borttagen:", userId, deleteData)

    // --- 2) Ta bort från profiles (om kaskad inte är konfigurerat) ---
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId)

    // Inte kritiskt – auth-användaren är redan borttagen.
    if (profileError) {
      console.warn(
        "[delete-user] profiles-delete misslyckades (ej kritiskt):",
        serializeError(profileError)
      )
    } else {
      console.log("[delete-user] Profil borttagen:", userId)
    }

    return jsonResponse({ success: true, userId })
  } catch (err) {
    console.error("[delete-user] Oväntat fel:", serializeError(err))
    return errorResponse("Serverfel: " + serializeError(err), 500)
  }
})