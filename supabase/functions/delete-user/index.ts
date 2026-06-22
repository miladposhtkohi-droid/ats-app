import { requireAdmin } from "../_shared/auth.ts"
import { jsonResponse, errorResponse, handleOptions, serializeError } from "../_shared/cors.ts"

/**
 * Hjälpfunktion: returnerar true om ett fel från auth.admin-verktygen beror
 * på fel/ogiltig service_role-nyckel. Dessa fel visas nästan alltid som ett
 * kryptiskt 500 i frontend, men är i själva verket konfigurationsfel.
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
    console.log("[delete-user] Anrop mottaget, method:", req.method)

    const auth = await requireAdmin(req.headers.get("Authorization"))
    if (!auth.ok) return auth.response
    const { user: caller, supabase } = auth

    // --- Läs body ---
    let body: { userId?: unknown }
    try {
      body = await req.json()
    } catch (parseErr) {
      // Logga HELA error-objektet (Deno's console skriver ut även non-enumerable).
      console.error("[delete-user] Kunde inte parsa JSON-body:", parseErr)
      console.error("[delete-user] Serialiserat:", serializeError(parseErr))
      return errorResponse("Ogiltig JSON i body", 400)
    }

    const userId = typeof body.userId === "string" ? body.userId.trim() : ""

    console.log("[delete-user] Body mottagen:", {
      userId: userId || "(saknas)",
      callerId: caller.id,
      rawUserIdType: typeof body.userId,
      rawUserIdValue: body.userId,
    })

    if (!userId) {
      console.warn("[delete-user] userId saknas eller är inte en sträng i body")
      return errorResponse("userId krävs (sträng)", 400)
    }

    // UUID-formatkontroll – ett ogiltigt UUID ger ofta "User not found" /
    // "invalid input syntax for type uuid" som döljs bakom ett 500 annars.
    const UUID_RE =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!UUID_RE.test(userId)) {
      console.warn("[delete-user] userId är inte ett giltigt UUID:", userId)
      return errorResponse("userId är inte ett giltigt UUID", 400)
    }

    // Skydd: en admin får inte radera sitt eget konto via denna funktion.
    if (userId === caller.id) {
      console.warn("[delete-user] Admin försökte ta bort sitt eget konto:", caller.id)
      return errorResponse("Du kan inte ta bort ditt eget konto", 400)
    }

    // --- 0) Kontrollera att användaren faktiskt existerar i Auth ---
    // deleteUser på ett icke-existerande UUID returnerar "User not found",
    // vilket är en mycket vanlig orsak till non-2xx. Vi kollar explicit först
    // så att frontend får ett tydligt 404 istället för ett kryptiskt 500.
    const { data: existingUser, error: lookupError } =
      await supabase.auth.admin.getUserById(userId)

    if (lookupError) {
      // HELA error-objektet (non-enumerable props syns via console, inte via JSON).
      console.error("[delete-user] getUserById fel-objekt (raw):", lookupError)
      console.error(
        "[delete-user] getUserById serialiserat:",
        serializeError(lookupError)
      )

      // Särskild hantering: om detta ser ut som ett API-nyckel-fel är det
      // konfigurationsfel (service_role), inte att användaren saknas.
      if (looksLikeKeyError(lookupError)) {
        return errorResponse(
          "Serverfel: SUPABASE_SERVICE_ROLE_KEY verkar vara ogiltig. " +
            "Detta är det vanligaste felet när delete-user returnerar 500. " +
            "Detaljer: " + serializeError(lookupError),
          500
        )
      }

      // Annars antar vi att användaren inte finns (eller andra auth-fel).
      return errorResponse(
        "Kunde inte hitta användaren i Auth: " + serializeError(lookupError),
        404
      )
    }

    if (!existingUser?.user) {
      console.warn("[delete-user] Användaren existerar inte i Auth:", userId)
      return errorResponse("Användaren hittades inte i Auth.", 404)
    }

    // --- 1) Ta bort från auth.users ---
    console.log("[delete-user] Försöker ta bort auth-användare:", userId)
    const { data: deleteData, error: authError } =
      await supabase.auth.admin.deleteUser(userId)

    // Auth-fel (AuthError) har non-enumerable props → strängsätts annars till "{}".
    if (authError) {
      // Logga både raw-objektet (för full info) och den serialiserade strängen.
      console.error("[delete-user] deleteUser fel-objekt (raw):", authError)
      console.error(
        "[delete-user] deleteUser misslyckades för",
        userId,
        ":",
        serializeError(authError)
      )

      if (looksLikeKeyError(authError)) {
        return errorResponse(
          "Serverfel: SUPABASE_SERVICE_ROLE_KEY verkar vara ogiltig. " +
            "Detaljer: " + serializeError(authError),
          500
        )
      }

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
      console.error("[delete-user] profiles-delete fel-objekt (raw):", profileError)
      console.warn(
        "[delete-user] profiles-delete misslyckades (ej kritiskt):",
        serializeError(profileError)
      )
    } else {
      console.log("[delete-user] Profil borttagen:", userId)
    }

    return jsonResponse({ success: true, userId })
  } catch (err) {
    // Fånga ALLT – inklusive fel från adminClient() om nyckeln saknas.
    console.error("[delete-user] Oväntat fel (raw error-objekt):", err)
    console.error("[delete-user] Oväntat fel (serialiserat):", serializeError(err))
    if (err instanceof Error && err.stack) {
      console.error("[delete-user] Stack trace:", err.stack)
    }
    return errorResponse("Serverfel: " + serializeError(err), 500)
  }
})