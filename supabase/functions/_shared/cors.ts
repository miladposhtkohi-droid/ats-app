// Tillåtna ursprung. "*" fungerar för Authorization-headern (apikey/authorization
// är inte credentials i Supabase-sammanhang). Vill du låsa till din dev-miljö kan
// du lägga till t.ex. "http://localhost:5173" här.
const ALLOWED_ORIGINS = ["*"]

export const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
}

/**
 * Standardiserad hantering av CORS preflight (OPTIONS).
 * Returna detta direkt i varje Edge Function.
 */
export function handleOptions(): Response {
  return new Response("ok", { status: 200, headers: corsHeaders })
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

export function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status)
}

/**
 * Serialiserar ett fel till en läsbar sträng.
 *
 * Viktigt: Supabase auth-fel (AuthError) ärver från Error, och Errors egna
 * properties (message/stack/code/name) är NON-enumerable. Därför returnerar
 * JSON.stringify(err) "{}" – vilket är exakt det "{}"-fel användaren ser.
 * Här plockar vi ut fälten explicit istället.
 */
export function serializeError(err: unknown): string {
  if (err == null) return "okänt fel (null/undefined)"
  if (typeof err === "string") return err
  if (err instanceof Error) {
    const anyErr = err as Error & { code?: string; status?: number }
    const parts: string[] = []
    if (anyErr.name && anyErr.name !== "Error") parts.push(anyErr.name)
    if (anyErr.message) parts.push(anyErr.message)
    if (anyErr.code) parts.push(`code=${anyErr.code}`)
    if (anyErr.status != null) parts.push(`status=${anyErr.status}`)
    return parts.length ? parts.join(" | ") : "Error (utan meddelande)"
  }
  // Vanligt objekt (t.ex. { message, code } från supabase-js).
  try {
    const obj = err as Record<string, unknown>
    const msg = obj.message
    if (typeof msg === "string" && msg) return msg
    return JSON.stringify(err)
  } catch {
    return String(err)
  }
}