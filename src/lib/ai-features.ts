import { AI_FEATURE_KEYS, type AIFeatureKey } from "@/lib/types"
import { createClient } from "@/utils/supabase/client"

export interface UserAIFeatureStatus {
  [key: string]: boolean
}

/**
 * Check if a specific AI feature is enabled for the current user
 */
export async function isAIFeatureEnabled(featureKey: AIFeatureKey): Promise<boolean> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  // First check global setting
  const { data: globalSetting } = await supabase
    .from("ai_feature_settings")
    .select("enabled")
    .eq("feature_key", featureKey)
    .single()

  // If global is disabled, return false
  if (globalSetting && !globalSetting.enabled) {
    return false
  }

  // Check user-specific setting
  const { data: userSetting } = await supabase
    .from("user_ai_features")
    .select("enabled")
    .eq("user_id", user.id)
    .eq("feature_key", featureKey)
    .single()

  // If no user override exists, default to false (users must be explicitly granted access)
  if (!userSetting) {
    return false
  }

  return userSetting.enabled
}

/**
 * Get all AI feature statuses for the current user
 */
export async function getAllAIFeatureStatuses(): Promise<UserAIFeatureStatus> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Default all to false (users must be explicitly granted access)
  const statuses: UserAIFeatureStatus = {}
  AI_FEATURE_KEYS.forEach((key) => {
    statuses[key] = false
  })

  if (!user) return statuses

  // Get global settings
  const { data: globalSettings } = await supabase.from("ai_feature_settings").select("feature_key, enabled")

  // Build a map of global settings
  const globalMap = new Map<string, boolean>()
  globalSettings?.forEach((setting) => {
    globalMap.set(setting.feature_key, setting.enabled)
  })

  // Get user-specific settings
  const { data: userSettings } = await supabase
    .from("user_ai_features")
    .select("feature_key, enabled")
    .eq("user_id", user.id)

  // Apply user settings only if global is enabled
  userSettings?.forEach((setting) => {
    const globalEnabled = globalMap.get(setting.feature_key) ?? true
    // Feature is enabled only if both global AND user setting are enabled
    statuses[setting.feature_key] = globalEnabled && setting.enabled
  })

  return statuses
}

/**
 * React hook-friendly function to get AI features
 */
export function useAIFeatures() {
  return {
    isEnabled: isAIFeatureEnabled,
    getAllStatuses: getAllAIFeatureStatuses,
  }
}
