import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Allowed redirect paths (prevent open redirect attacks)
const ALLOWED_REDIRECTS = [
  "/",
  "/profile",
  "/admin",
  "/assistant",
  "/update-password",
  "/flashcards",
]

function isValidRedirect(path: string): boolean {
  // Must start with / (relative path only)
  if (!path.startsWith("/")) return false
  
  // Must not contain protocol or double slashes (prevents //evil.com)
  if (path.includes("//") || path.includes(":")) return false
  
  // Check against allowlist or allow any path under the app
  const normalizedPath = path.split("?")[0] // Remove query params for comparison
  
  // Allow exact matches or paths that start with allowed prefixes
  return ALLOWED_REDIRECTS.some(allowed => 
    normalizedPath === allowed || normalizedPath.startsWith(allowed + "/")
  )
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/"
  const origin = requestUrl.origin

  // Validate and sanitize the redirect URL
  const safeNext = isValidRedirect(next) ? next : "/"

  if (code) {
    const supabase = await createClient(cookies())
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirect to the validated "next" URL after successful auth
      return NextResponse.redirect(`${origin}${safeNext}`)
    }
  }

  // If there's an error or no code, redirect to error page
  return NextResponse.redirect(`${origin}/error?message=Could not authenticate user`)
}
