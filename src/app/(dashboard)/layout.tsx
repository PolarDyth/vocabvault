import type React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { AppHeader } from "@/components/app-header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient(cookies())

  const { data: userData, error: userError } = await supabase.auth.getUser()
  
  if (userError || !userData?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      {children}
    </div>
  )
}
