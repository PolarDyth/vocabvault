import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { AssistantContent } from "@/components/assistant/assistant-content"

export default async function AssistantPage() {
  const supabase = await createClient(cookies())

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    redirect("/login")
  }

  // Check if user has assistant feature enabled
  const { data: globalSetting } = await supabase
    .from("ai_feature_settings")
    .select("enabled")
    .eq("feature_key", "assistant")
    .single()

  // If global setting is disabled, redirect to dictionary
  if (globalSetting && !globalSetting.enabled) {
    redirect("/")
  }

  // Check user-specific setting
  const { data: userSetting } = await supabase
    .from("user_ai_features")
    .select("enabled")
    .eq("user_id", userData.user.id)
    .eq("feature_key", "assistant")
    .single()

  // If no user setting exists or it's disabled, redirect to dictionary
  if (!userSetting || !userSetting.enabled) {
    redirect("/")
  }

  const { data: words } = await supabase
    .from("words")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <AssistantContent words={words || []} userId={userData.user.id} />
    </div>
  )
}
