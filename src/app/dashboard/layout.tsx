import type React from "react"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import DashboardNav from "@/components/dashboard-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav user={session.user} />
      <div className="flex-1 p-8">{children}</div>
    </div>
  )
}

