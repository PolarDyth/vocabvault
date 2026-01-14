/**
 * In-memory rate limiter for feedback submissions
 * Used as a lightweight alternative to database-based rate limiting
 */

export interface RateLimitTracker {
  count: number
  resetAt: number
}

export interface InMemoryRateLimiter {
  check: (identifier: string) => boolean
  reset: (identifier?: string) => void
  getTracker: (identifier: string) => RateLimitTracker | undefined
  getWindowMs: () => number
  getMaxRequests: () => number
}

/**
 * Creates an in-memory rate limiter
 * @param windowMs - Time window in milliseconds
 * @param maxRequests - Maximum requests allowed in the window
 */
export function createInMemoryRateLimiter(
  windowMs: number = 60 * 60 * 1000, // 1 hour default
  maxRequests: number = 5
): InMemoryRateLimiter {
  const tracker = new Map<string, RateLimitTracker>()

  function check(identifier: string): boolean {
    const now = Date.now()
    const existing = tracker.get(identifier)

    if (!existing || now > existing.resetAt) {
      tracker.set(identifier, { count: 1, resetAt: now + windowMs })
      return true
    }

    if (existing.count >= maxRequests) {
      return false
    }

    existing.count++
    return true
  }

  function reset(identifier?: string): void {
    if (identifier) {
      tracker.delete(identifier)
    } else {
      tracker.clear()
    }
  }

  function getTracker(identifier: string): RateLimitTracker | undefined {
    return tracker.get(identifier)
  }

  function getWindowMs(): number {
    return windowMs
  }

  function getMaxRequests(): number {
    return maxRequests
  }

  return {
    check,
    reset,
    getTracker,
    getWindowMs,
    getMaxRequests,
  }
}

// Default feedback rate limiter instance
export const feedbackRateLimiter = createInMemoryRateLimiter(
  60 * 60 * 1000, // 1 hour
  5 // 5 requests per hour
)
