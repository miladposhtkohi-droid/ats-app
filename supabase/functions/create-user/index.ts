import { requireAdmin } from "../_shared/auth.ts"
import { jsonResponse, errorResponse, handleOptions, serializeError } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions()

  try {
    console.log("[create-user] Anrop mottaget, method:", req.method)

    const auth = await requireAdmin(req.headers.get("Authorization"))
    if (!auth.ok) return auth.response
    const { supabase } = auth

    // --- Läs in body ---
    let body: { email?: unknown; password?: unknown; role?: unknown }
    try {
      body = await req.json()
    } catch (parseErr) {
      console.error("[create-user] Kunde inte parsa JSON-body:", serializeError(parseErr))
      return errorResponse("Ogiltig JSON i body", 400)
    }

    const email = typeof body.email === "string" ? body.email.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""
    const role = typeof body.role === "string" ? body.role : ""

    console.log("[create-user] Body mottagen:", {
      email: email || "(saknas)",
      password: password ? "***" : "(saknas)",
      role: role || "(saknas)",
    })

    // --- Validering ---
    if (!email) {
      console.warn("[create-user] email saknas i body")
      return errorResponse("email krävs", 400)
    }
    if (!password) {
      console.warn("[create-user] password saknas i body")
      return errorResponse("password krävs", 400)
    }
    if (!role) {
      console.warn("[create-user] role saknas i body")
      return errorResponse("role krävs", 400)
    }
    if (!["admin", "customer"].includes(role)) {
      console.warn("[create-user] Ogiltig role:", role)
      return errorResponse("role måste vara 'admin' eller 'customer'", 400)
    }
    if (password.length < 6) {
      return errorResponse("Lösenordet måste vara minst 6 tecken", 400)
    }
    // Enkel email-check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.warn("[create-user] Ogiltigt email-format:", email)
      return errorResponse("Ogiltigt email-format", 400)
    }

    // --- 1) Skapa användare i auth.users ---
    console.log("[create-user] Skapar auth-användare för", email)
    const {
      data: authData,
      error: authError,
    } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role },
    })

    if (authError || !authData?.user) {
      console.error("[create-user] createUser misslyckades:", serializeError(authError))
      return errorResponse("Kunde inte skapa auth-användare: " + serializeError(authError), 400)
    }

    const userId = authData.user.id
    const userEmail = authData.user.email ?? email
    console.log("[create-user] Auth-användare skapad:", userId, userEmail)

    // --- 2) Skapa motsvarande rad i profiles ---
    // VIKTIGT: profiles.email är NOT NULL, så email MÅSTE skickas med här.
    console.log("[create-user] Skapar profilrad för", userId)
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: userId, email: userEmail, role })

    if (profileError) {
      console.error(
        "[create-user] Profile-insert misslyckades – rullar tillbaka auth-användare",
        userId,
        ":",
        serializeError(profileError)
      )

      // --- Rollback: ta bort auth-användaren så vi inte får föräldralösa konton ---
      const { error: rollbackError } = await supabase.auth.admin.deleteUser(userId)
      if (rollbackError) {
        console.error(
          "[create-user] Rollback misslyckades för user",
          userId,
          ":",
          serializeError(rollbackError)
        )
      } else {
        console.log("[create-user] Rollback OK – auth-användare borttagen:", userId)
      }

      return errorResponse(
        "Skapade användare men kunde inte skapa profil: " + serializeError(profileError),
        500
      )
    }

    console.log("[create-user] Profil skapad, allt OK:", userId)

    return jsonResponse({ success: true, userId, email: userEmail })
  } catch (err) {
    console.error("[create-user] Oväntat fel:", serializeError(err))
    return errorResponse("Serverfel: " + serializeError(err), 500)
  }
})