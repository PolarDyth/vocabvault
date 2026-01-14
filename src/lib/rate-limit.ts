/**
 * Supabase-based rate limiter
 * Works reliably across serverless instances
 */

import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import type { SupabaseClient } from "@supabase/supabase-js"

interface RateLimitResult {
  success: boolean
  remaining: number
  resetIn: number
}

interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number
  /** Time window in seconds */
  windowSeconds: number
  /** Whether to allow requests when rate limit check fails (default: true for non-sensitive endpoints) */
  failOpen?: boolean
}

interface RateLimitResponse {
  success: boolean
  remaining: number
  reset_in: number
}

/**
 * Check rate limit using Supabase
 * @param identifier - Unique identifier (user ID, IP, etc.)
 * @param endpoint - API endpoint name
 * @param config - Rate limit configuration
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const supabase = await createClient(cookies())
    
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: config.maxRequests,
      p_window_seconds: config.windowSeconds,
    }) as { data: RateLimitResponse | null; error: Error | null }

    if (error || !data) {
      console.error("Rate limit check failed:", error)
      // Fail open/closed based on config (default: open for backwards compatibility)
      const shouldAllow = config.failOpen !== false
      return { success: shouldAllow, remaining: shouldAllow ? config.maxRequests : 0, resetIn: config.windowSeconds }
    }

    return {
      success: data.success,
      remaining: data.remaining,
      resetIn: data.reset_in,
    }
  } catch (err) {
    console.error("Rate limit error:", err)
    // Fail open/closed based on config
    const shouldAllow = config.failOpen !== false
    return { success: shouldAllow, remaining: shouldAllow ? config.maxRequests : 0, resetIn: config.windowSeconds }
  }
}

/**
 * Check rate limit using a client-side Supabase instance
 * For use in API routes that already have a client
 */
export async function checkRateLimitWithClient(
  supabase: SupabaseClient,
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: config.maxRequests,
      p_window_seconds: config.windowSeconds,
    }) as { data: RateLimitResponse | null; error: Error | null }

    if (error || !data) {
      console.error("Rate limit check failed:", error)
      // Fail open/closed based on config (default: open for backwards compatibility)
      const shouldAllow = config.failOpen !== false
      return { success: shouldAllow, remaining: shouldAllow ? config.maxRequests : 0, resetIn: config.windowSeconds }
    }

    return {
      success: data.success,
      remaining: data.remaining,
      resetIn: data.reset_in,
    }
  } catch (err) {
    console.error("Rate limit error:", err)
    // Fail open/closed based on config
    const shouldAllow = config.failOpen !== false
    return { success: shouldAllow, remaining: shouldAllow ? config.maxRequests : 0, resetIn: config.windowSeconds }
  }
}

// Pre-configured rate limit configs
export const rateLimitConfigs = {
  // AI Assistant: 5 requests per minute (fail closed - sensitive/costly endpoint)
  assistant: { maxRequests: 5, windowSeconds: 60, failOpen: false },
  
  // Example generation: 10 requests per minute (fail closed - sensitive/costly endpoint)
  examples: { maxRequests: 10, windowSeconds: 60, failOpen: false },
  
  // Dictionary lookup: 30 requests per minute (fail open - public endpoint)
  dictionary: { maxRequests: 30, windowSeconds: 60, failOpen: true },
  
  // General API: 100 requests per minute
  general: { maxRequests: 100, windowSeconds: 60, failOpen: true },
  
  // Auth actions: 5 requests per minute (fail closed - security sensitive)
  auth: { maxRequests: 5, windowSeconds: 60, failOpen: false },
}
