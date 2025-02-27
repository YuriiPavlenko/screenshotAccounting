import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import LoginPage from "@/components/login-page"

export default async function Home() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  }

  return <LoginPage />
}

