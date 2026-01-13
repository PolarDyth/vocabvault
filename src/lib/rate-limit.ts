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
      // Fail open - allow request if rate limit check fails
      return { success: true, remaining: config.maxRequests, resetIn: config.windowSeconds }
    }

    return {
      success: data.success,
      remaining: data.remaining,
      resetIn: data.reset_in,
    }
  } catch (err) {
    console.error("Rate limit error:", err)
    // Fail open
    return { success: true, remaining: config.maxRequests, resetIn: config.windowSeconds }
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
      return { success: true, remaining: config.maxRequests, resetIn: config.windowSeconds }
    }

    return {
      success: data.success,
      remaining: data.remaining,
      resetIn: data.reset_in,
    }
  } catch (err) {
    console.error("Rate limit error:", err)
    return { success: true, remaining: config.maxRequests, resetIn: config.windowSeconds }
  }
}

// Pre-configured rate limit configs
export const rateLimitConfigs = {
  // AI Assistant: 5 requests per minute
  assistant: { maxRequests: 5, windowSeconds: 60 },
  
  // Example generation: 10 requests per minute
  examples: { maxRequests: 10, windowSeconds: 60 },
  
  // Dictionary lookup: 30 requests per minute
  dictionary: { maxRequests: 30, windowSeconds: 60 },
  
  // General API: 100 requests per minute
  general: { maxRequests: 100, windowSeconds: 60 },
  
  // Auth actions: 5 requests per minute
  auth: { maxRequests: 5, windowSeconds: 60 },
}
