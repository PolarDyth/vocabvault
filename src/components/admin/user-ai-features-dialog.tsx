"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Volume2, MessageSquare, Network, BookOpen, Lightbulb, AlertCircle, Info, Sparkles } from "lucide-react"
import type { UserProfile, UserAIFeature, AIFeatureKey } from "@/lib/types"
import { AI_FEATURE_KEYS, AI_FEATURE_LABELS } from "@/lib/types"
import { createClient } from "@/utils/supabase/client"

const featureIcons: Record<AIFeatureKey, typeof Volume2> = {
  assistant: Sparkles,
  pronunciation_assistance: Volume2,
  example_sentences: MessageSquare,
  related_words: Network,
  grammar_explanations: BookOpen,
  smart_flashcards: Lightbulb,
}

const featureDescriptions: Record<AIFeatureKey, string> = {
  assistant: "Access to the AI Assistant chat interface",
  pronunciation_assistance: "AI-powered pronunciation guidance",
  example_sentences: "Generate contextual example sentences",
  related_words: "Suggestions for related vocabulary",
  grammar_explanations: "Detailed grammar breakdowns",
  smart_flashcards: "AI-optimized spaced repetition",
}

interface UserAIFeaturesDialogProps {
  user: UserProfile | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

export function UserAIFeaturesDialog({ user, open, onOpenChange, onSaved }: UserAIFeaturesDialogProps) {
  const [userFeatures, setUserFeatures] = useState<Map<string, boolean>>(new Map())
  const [globalFeatures, setGlobalFeatures] = useState<Map<string, boolean>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !user) return

    async function fetchFeatures() {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      try {
        // Fetch global feature settings
        const { data: globalData } = await supabase.from("ai_feature_settings").select("feature_key, enabled")

        const globalMap = new Map<string, boolean>()
        globalData?.forEach((f) => {
          globalMap.set(f.feature_key, f.enabled)
        })
        // Default all features to enabled if not in database
        AI_FEATURE_KEYS.forEach((key) => {
          if (!globalMap.has(key)) {
            globalMap.set(key, true)
          }
        })
        setGlobalFeatures(globalMap)

        // Fetch user-specific feature overrides
        const { data: userData, error: userError } = await supabase
          .from("user_ai_features")
          .select("*")
          .eq("user_id", user?.user_id || "")

        if (userError && !userError.message.includes("does not exist")) {
          throw userError
        }

        const userMap = new Map<string, boolean>()
        // Start with global defaults
        AI_FEATURE_KEYS.forEach((key) => {
          userMap.set(key, globalMap.get(key) ?? true)
        })
        // Apply user overrides
        userData?.forEach((f: UserAIFeature) => {
          userMap.set(f.feature_key, f.enabled)
        })
        setUserFeatures(userMap)
      } catch (err) {
        console.error("Error fetching AI features:", err)
        setError("Failed to load AI feature settings")
      } finally {
        setLoading(false)
      }
    }

    fetchFeatures()
  }, [open, user])

  const handleToggle = (featureKey: string) => {
    setUserFeatures((prev) => {
      const newMap = new Map(prev)
      newMap.set(featureKey, !prev.get(featureKey))
      return newMap
    })
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    setError(null)
    const supabase = createClient()

    try {
      const {
        data: { user: adminUser },
      } = await supabase.auth.getUser()

      // Upsert all feature settings for this user
      for (const [featureKey, enabled] of userFeatures.entries()) {
        const { error: upsertError } = await supabase.from("user_ai_features").upsert(
          {
            user_id: user.user_id,
            feature_key: featureKey,
            enabled,
            updated_by: adminUser?.id,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,feature_key",
          },
        )

        if (upsertError) throw upsertError
      }

      // Log the action
      if (adminUser) {
        await supabase.from("audit_logs").insert({
          admin_id: adminUser.id,
          action: "update_user_ai_features",
          target_type: "user_ai_features",
          target_id: user.user_id,
          old_value: null,
          new_value: Object.fromEntries(userFeatures),
        })
      }

      onSaved?.()
      onOpenChange(false)
    } catch (err) {
      console.error("Error saving AI features:", err)
      setError("Failed to save AI feature settings")
    } finally {
      setSaving(false)
    }
  }

  const handleEnableAll = () => {
    const newMap = new Map<string, boolean>()
    AI_FEATURE_KEYS.forEach((key) => {
      // Only enable if global is enabled
      newMap.set(key, globalFeatures.get(key) ?? true)
    })
    setUserFeatures(newMap)
  }

  const handleDisableAll = () => {
    const newMap = new Map<string, boolean>()
    AI_FEATURE_KEYS.forEach((key) => {
      newMap.set(key, false)
    })
    setUserFeatures(newMap)
  }

  const enabledCount = Array.from(userFeatures.values()).filter(Boolean).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>AI Features for {user?.display_name || user?.email || "User"}</DialogTitle>
          <DialogDescription>Enable or disable AI-powered features for this specific user</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between">
              <Badge variant="secondary">
                {enabledCount} of {AI_FEATURE_KEYS.length} enabled
              </Badge>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleEnableAll}>
                  Enable All
                </Button>
                <Button variant="outline" size="sm" onClick={handleDisableAll}>
                  Disable All
                </Button>
              </div>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {AI_FEATURE_KEYS.map((featureKey) => {
                const Icon = featureIcons[featureKey]
                const isEnabled = userFeatures.get(featureKey) ?? true
                const isGloballyDisabled = !(globalFeatures.get(featureKey) ?? true)

                return (
                  <div
                    key={featureKey}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                      isGloballyDisabled ? "opacity-60 bg-muted/30" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`rounded-md p-1.5 ${
                          isEnabled && !isGloballyDisabled
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{AI_FEATURE_LABELS[featureKey]}</span>
                          {isGloballyDisabled && (
                            <Badge variant="outline" className="text-xs">
                              Globally Disabled
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{featureDescriptions[featureKey]}</p>
                      </div>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => handleToggle(featureKey)}
                      disabled={isGloballyDisabled}
                    />
                  </div>
                )
              })}
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                User-specific settings override global defaults. If a feature is globally disabled, it cannot be enabled
                for individual users.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
