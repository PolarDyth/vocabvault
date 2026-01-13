import { DictionaryContent } from "@/components/dictionary/dictionary-content"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function DictionaryPage() {
  const supabase = await createClient(cookies())

  const { data: userData } = await supabase.auth.getUser()
  
  // This shouldn't happen since layout checks auth, but TypeScript needs it
  if (!userData?.user) {
    redirect("/login")
  }

  const { data: words, error: wordsError } = await supabase
    .from("words")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false })

  if (wordsError) {
    console.error("Error fetching words:", wordsError)
  }

  return <DictionaryContent initialWords={words || []} userId={userData.user.id} />
}
