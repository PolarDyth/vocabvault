import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/"
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient(cookies())
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirect to the "next" URL after successful auth
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  console.log("Redirecting to: ", `${origin}${next}`)
  // If there's an error or no code, redirect to error page
  return NextResponse.redirect(`${origin}/error?message=Could not authenticate user`)
}
