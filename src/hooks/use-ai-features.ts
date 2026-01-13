"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import { AI_FEATURE_KEYS, type AIFeatureKey } from "@/lib/types"

interface AIFeaturesState {
  /** Map of feature key to enabled status for the current user */
  features: Map<string, boolean>
  /** Whether at least one AI feature is enabled for the user */
  hasAnyEnabled: boolean
  /** Whether the features are still loading */
  isLoading: boolean
  /** Any error that occurred during fetching */
  error: string | null
  /** Refetch the features (useful after updates) */
  refetch: () => void
}

/**
 * Hook to check AI feature availability for the current user.
 * 
 * Logic:
 * - Global settings (ai_feature_settings) control if a feature is available at all
 * - User settings (user_ai_features) control if a user has access to available features
 * - New features default to FALSE for users (must be explicitly enabled by admin)
 * - A feature is enabled only if: global is enabled AND user has it enabled
 */
export function useAIFeatures(): AIFeaturesState {
  const [features, setFeatures] = useState<Map<string, boolean>>(() => new Map())
  const [hasAnyEnabled, setHasAnyEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    
    async function fetchFeatures() {
      if (!isMounted.current) return
      
      setIsLoading(true)
      setError(null)

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!isMounted.current) return

      if (!user) {
        setFeatures(new Map())
        setHasAnyEnabled(false)
        setIsLoading(false)
        return
      }

      try {
        // Fetch global feature settings (controls availability)
        const { data: globalData, error: globalError } = await supabase
          .from("ai_feature_settings")
          .select("feature_key, enabled")

        if (!isMounted.current) return

        if (globalError && !globalError.message.includes("does not exist")) {
          throw globalError
        }

        const globalMap = new Map<string, boolean>()
        globalData?.forEach((f) => {
          globalMap.set(f.feature_key, f.enabled)
        })
        // Default global features to true (available) if not in database
        AI_FEATURE_KEYS.forEach((key) => {
          if (!globalMap.has(key)) {
            globalMap.set(key, true)
          }
        })

        // Fetch user-specific feature settings
        const { data: userData, error: userError } = await supabase
          .from("user_ai_features")
          .select("feature_key, enabled")
          .eq("user_id", user.id)

        if (!isMounted.current) return

        if (userError && !userError.message.includes("does not exist")) {
          throw userError
        }

        // Build user's enabled features map
        const userEnabledMap = new Map<string, boolean>()
        userData?.forEach((f) => {
          userEnabledMap.set(f.feature_key, f.enabled)
        })

        // Calculate final feature availability for user
        // Feature is enabled only if: global enabled AND user explicitly enabled
        // New features default to FALSE for users (not in user_ai_features = disabled)
        const finalMap = new Map<string, boolean>()
        AI_FEATURE_KEYS.forEach((key) => {
          const globalEnabled = globalMap.get(key) ?? true
          const userEnabled = userEnabledMap.get(key) ?? false // Default to FALSE for new features
          finalMap.set(key, globalEnabled && userEnabled)
        })

        // Check if at least one feature is enabled for the user
        const hasEnabled = Array.from(finalMap.values()).some((enabled) => enabled)

        if (isMounted.current) {
          setFeatures(finalMap)
          setHasAnyEnabled(hasEnabled)
        }
      } catch (err) {
        console.error("Error checking AI features:", err)
        if (isMounted.current) {
          setError(err instanceof Error ? err.message : "Failed to load AI features")
          setFeatures(new Map())
          setHasAnyEnabled(false)
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false)
        }
      }
    }

    fetchFeatures()

    return () => {
      isMounted.current = false
    }
  }, [refetchTrigger])

  const refetch = () => setRefetchTrigger((n) => n + 1)

  return {
    features,
    hasAnyEnabled,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Check if a specific AI feature is enabled for the current user.
 * @param featureKey The feature key to check
 * @returns Object with enabled status, loading state, and error
 */
export function useAIFeature(featureKey: AIFeatureKey) {
  const { features, isLoading, error, refetch } = useAIFeatures()

  return {
    isEnabled: features.get(featureKey) ?? false,
    isLoading,
    error,
    refetch,
  }
}
