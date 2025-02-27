import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { Database } from "@/lib/database.types"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    await supabase.auth.exchangeCodeForSession(code)

    // Check if user is whitelisted
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: whitelist } = await supabase.from("whitelisted_emails").select("*").eq("email", user.email).single()

      if (!whitelist) {
        // Sign out if not whitelisted
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL(`/?error=unauthorized`, requestUrl.origin))
      }
    }
  }

  return NextResponse.redirect(new URL("/dashboard", request.url))
}

