import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const supabase = await createClient(cookies())

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("user_profiles").select("role").eq("user_id", user.id).single()

  if (profile?.role !== "admin") {
    redirect("/dictionary")
  }

  return <AdminDashboard />
}
