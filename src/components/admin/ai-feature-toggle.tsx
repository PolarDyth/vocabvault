"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Sparkles, Volume2, MessageSquare, Network, BookOpen, Lightbulb, AlertCircle } from "lucide-react"
import type { AIFeatureSetting } from "@/lib/types"
import { createClient } from "@/utils/supabase/client"

const featureIcons: Record<string, typeof Sparkles> = {
  assistant: Sparkles,
  pronunciation_assistance: Volume2,
  example_sentences: MessageSquare,
  related_words: Network,
  grammar_explanations: BookOpen,
  smart_flashcards: Lightbulb,
}

const defaultFeatures: Omit<AIFeatureSetting, "id" | "created_at" | "updated_at" | "updated_by">[] = [
  {
    feature_key: "assistant",
    feature_name: "AI Assistant",
    description: "Access to the AI Assistant chat interface for learning help",
    enabled: true,
  },
  {
    feature_key: "pronunciation_assistance",
    feature_name: "Pronunciation Assistance",
    description: "AI-powered pronunciation guidance using text-to-speech",
    enabled: true,
  },
  {
    feature_key: "example_sentences",
    feature_name: "Example Sentences",
    description: "Generate contextual example sentences for vocabulary words",
    enabled: true,
  },
  {
    feature_key: "related_words",
    feature_name: "Related Word Suggestions",
    description: "Intelligent suggestions for related vocabulary and synonyms",
    enabled: true,
  },
  {
    feature_key: "grammar_explanations",
    feature_name: "Grammar Explanations",
    description: "Detailed grammar breakdowns and usage patterns",
    enabled: true,
  },
  {
    feature_key: "smart_flashcards",
    feature_name: "Smart Flashcards",
    description: "AI-optimized spaced repetition scheduling",
    enabled: true,
  },
]

export function AIFeatureToggles() {
  const [features, setFeatures] = useState<AIFeatureSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUsingDefaults, setIsUsingDefaults] = useState(false)

  useEffect(() => {
    async function fetchFeatures() {
      const supabase = createClient()
      const { data, error: queryError } = await supabase.from("ai_feature_settings").select("*").order("created_at")

      if (queryError) {
        // If table doesn't exist, show default features in read-only mode
        if (queryError.message.includes("does not exist") || queryError.code === "42P01") {
          setError(
            "The ai_feature_settings table doesn't exist. Showing default features (read-only). Please run the database migration script.",
          )
          setIsUsingDefaults(true)
          setFeatures(
            defaultFeatures.map((f, i) => ({
              ...f,
              id: `default-${i}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              updated_by: null,
            })),
          )
        } else {
          setError(`Error loading features: ${queryError.message}`)
        }
      } else if (data) {
        setFeatures(data)
      }
      setLoading(false)
    }

    fetchFeatures()
  }, [])

  const handleToggle = async (feature: AIFeatureSetting) => {
    if (isUsingDefaults) return // Don't allow toggling in read-only mode

    setUpdating(feature.id)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error: updateError } = await supabase
      .from("ai_feature_settings")
      .update({
        enabled: !feature.enabled,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", feature.id)

    if (!updateError) {
      // Log the action
      if (user) {
        await supabase.from("audit_logs").insert({
          admin_id: user.id,
          action: feature.enabled ? "disable_ai_feature" : "enable_ai_feature",
          target_type: "ai_feature",
          target_id: feature.id,
          old_value: { enabled: feature.enabled },
          new_value: { enabled: !feature.enabled },
        })
      }

      setFeatures((prev) => prev.map((f) => (f.id === feature.id ? { ...f, enabled: !f.enabled } : f)))
    }

    setUpdating(null)
  }

  const enabledCount = features.filter((f) => f.enabled).length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Feature Controls
              </CardTitle>
              <CardDescription>Enable or disable AI-powered features across the application</CardDescription>
            </div>
            <Badge variant="secondary">
              {enabledCount} of {features.length} enabled
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant={isUsingDefaults ? "default" : "destructive"} className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{isUsingDefaults ? "Database Setup Required" : "Error"}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading features...</div>
          ) : (
            <div className="space-y-4">
              {features.map((feature) => {
                const Icon = featureIcons[feature.feature_key] || Sparkles
                const isUpdating = updating === feature.id

                return (
                  <div
                    key={feature.id}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`rounded-lg p-2 ${
                          feature.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{feature.feature_name}</h3>
                          <Badge variant={feature.enabled ? "default" : "outline"} className="text-xs">
                            {feature.enabled ? "Active" : "Disabled"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                        {feature.updated_at && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Last updated: {new Date(feature.updated_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={feature.enabled}
                      onCheckedChange={() => handleToggle(feature)}
                      disabled={isUpdating || isUsingDefaults}
                      className="ml-4"
                    />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature Usage Impact</CardTitle>
          <CardDescription>Understand how each AI feature affects the user experience</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="font-medium">High Impact Features</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Example Sentences and Pronunciation Assistance are most frequently used by learners and directly impact
                vocabulary retention.
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="font-medium">Resource Considerations</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Related Word Suggestions uses the most AI processing. Consider disabling during high-traffic periods if
                needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
