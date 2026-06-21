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

    const { email, password, role } = await req.json()

    // --- Validering ---
    if (!email || !password || !role) {
      return errorResponse("email, password och role krävs", 400)
    }
    if (!["admin", "customer"].includes(role)) {
      return errorResponse("role måste vara 'admin' eller 'customer'", 400)
    }
    if (password.length < 6) {
      return errorResponse("Lösenordet måste vara minst 6 tecken", 400)
    }

    // --- 1) Skapa användare i auth.users ---
    const {
      data: authData,
      error: authError,
    } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role },
    })

    if (authError) {
      return errorResponse(authError.message, 400)
    }

    // --- 2) Skapa motsvarande rad i profiles ---
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: authData.user.id, role })

    if (profileError) {
      // Försök rulla tillbaka auth-användaren om profiles-insert misslyckas.
      await supabase.auth.admin.deleteUser(authData.user.id)
      return errorResponse(
        "Skapade användare men kunde inte skapa profil: " + profileError.message,
        500
      )
    }

    return jsonResponse({ success: true, userId: authData.user.id })
  } catch (err) {
    return errorResponse("Serverfel: " + String(err), 500)
  }
})