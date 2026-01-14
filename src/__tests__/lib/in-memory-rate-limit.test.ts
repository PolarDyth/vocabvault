import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { createInMemoryRateLimiter } from "@/lib/in-memory-rate-limit"

describe("In-Memory Rate Limiter", () => {
  describe("createInMemoryRateLimiter", () => {
    let rateLimiter: ReturnType<typeof createInMemoryRateLimiter>

    beforeEach(() => {
      // Create a rate limiter with 5 requests per 1 hour
      rateLimiter = createInMemoryRateLimiter(60 * 60 * 1000, 5)
    })

    afterEach(() => {
      rateLimiter.reset()
    })

    describe("check()", () => {
      it("should allow first request from a new identifier", () => {
        const result = rateLimiter.check("user-123")
        expect(result).toBe(true)
      })

      it("should track request count for an identifier", () => {
        rateLimiter.check("user-123")
        const tracker = rateLimiter.getTracker("user-123")
        expect(tracker?.count).toBe(1)
      })

      it("should allow requests up to the limit", () => {
        const identifier = "user-123"
        
        // First 5 requests should succeed
        for (let i = 0; i < 5; i++) {
          expect(rateLimiter.check(identifier)).toBe(true)
        }
        
        const tracker = rateLimiter.getTracker(identifier)
        expect(tracker?.count).toBe(5)
      })

      it("should block requests after limit is reached", () => {
        const identifier = "user-123"
        
        // Use up all 5 requests
        for (let i = 0; i < 5; i++) {
          rateLimiter.check(identifier)
        }
        
        // 6th request should fail
        expect(rateLimiter.check(identifier)).toBe(false)
      })

      it("should track different identifiers separately", () => {
        const user1 = "user-1"
        const user2 = "user-2"
        
        // Use up all requests for user1
        for (let i = 0; i < 5; i++) {
          rateLimiter.check(user1)
        }
        
        // user1 should be blocked
        expect(rateLimiter.check(user1)).toBe(false)
        
        // user2 should still be allowed
        expect(rateLimiter.check(user2)).toBe(true)
      })

      it("should handle IP addresses as identifiers", () => {
        const ip = "192.168.1.1"
        expect(rateLimiter.check(ip)).toBe(true)
        
        const tracker = rateLimiter.getTracker(ip)
        expect(tracker?.count).toBe(1)
      })

      it("should handle anonymous identifier", () => {
        expect(rateLimiter.check("anonymous")).toBe(true)
      })
    })

    describe("window expiration", () => {
      beforeEach(() => {
        vi.useFakeTimers()
      })

      afterEach(() => {
        vi.useRealTimers()
      })

      it("should reset count after window expires", () => {
        const identifier = "user-123"
        
        // Use up all requests
        for (let i = 0; i < 5; i++) {
          rateLimiter.check(identifier)
        }
        
        // Should be blocked
        expect(rateLimiter.check(identifier)).toBe(false)
        
        // Advance time past the window (1 hour + 1ms)
        vi.advanceTimersByTime(60 * 60 * 1000 + 1)
        
        // Should be allowed again (new window)
        expect(rateLimiter.check(identifier)).toBe(true)
        
        // Count should be reset to 1
        const tracker = rateLimiter.getTracker(identifier)
        expect(tracker?.count).toBe(1)
      })

      it("should set correct resetAt timestamp", () => {
        const now = Date.now()
        vi.setSystemTime(now)
        
        rateLimiter.check("user-123")
        
        const tracker = rateLimiter.getTracker("user-123")
        expect(tracker?.resetAt).toBe(now + 60 * 60 * 1000)
      })

      it("should not reset count before window expires", () => {
        const identifier = "user-123"
        
        // Use up all requests
        for (let i = 0; i < 5; i++) {
          rateLimiter.check(identifier)
        }
        
        // Advance time by 30 minutes (less than 1 hour)
        vi.advanceTimersByTime(30 * 60 * 1000)
        
        // Should still be blocked
        expect(rateLimiter.check(identifier)).toBe(false)
      })
    })

    describe("reset()", () => {
      it("should reset a specific identifier", () => {
        rateLimiter.check("user-1")
        rateLimiter.check("user-2")
        
        rateLimiter.reset("user-1")
        
        expect(rateLimiter.getTracker("user-1")).toBeUndefined()
        expect(rateLimiter.getTracker("user-2")).toBeDefined()
      })

      it("should reset all identifiers when called without argument", () => {
        rateLimiter.check("user-1")
        rateLimiter.check("user-2")
        rateLimiter.check("user-3")
        
        rateLimiter.reset()
        
        expect(rateLimiter.getTracker("user-1")).toBeUndefined()
        expect(rateLimiter.getTracker("user-2")).toBeUndefined()
        expect(rateLimiter.getTracker("user-3")).toBeUndefined()
      })

      it("should allow requests again after reset", () => {
        const identifier = "user-123"
        
        // Use up all requests
        for (let i = 0; i < 5; i++) {
          rateLimiter.check(identifier)
        }
        
        expect(rateLimiter.check(identifier)).toBe(false)
        
        rateLimiter.reset(identifier)
        
        expect(rateLimiter.check(identifier)).toBe(true)
      })
    })

    describe("configuration", () => {
      it("should respect custom window size", () => {
        vi.useFakeTimers()
        
        // 10 second window
        const shortWindowLimiter = createInMemoryRateLimiter(10 * 1000, 3)
        
        expect(shortWindowLimiter.getWindowMs()).toBe(10 * 1000)
        
        // Use all requests
        for (let i = 0; i < 3; i++) {
          shortWindowLimiter.check("user")
        }
        
        expect(shortWindowLimiter.check("user")).toBe(false)
        
        // Advance by 10 seconds
        vi.advanceTimersByTime(10 * 1000 + 1)
        
        expect(shortWindowLimiter.check("user")).toBe(true)
        
        vi.useRealTimers()
      })

      it("should respect custom max requests", () => {
        const strictLimiter = createInMemoryRateLimiter(60000, 2)
        
        expect(strictLimiter.getMaxRequests()).toBe(2)
        
        expect(strictLimiter.check("user")).toBe(true)
        expect(strictLimiter.check("user")).toBe(true)
        expect(strictLimiter.check("user")).toBe(false)
      })

      it("should use default values when not specified", () => {
        const defaultLimiter = createInMemoryRateLimiter()
        
        expect(defaultLimiter.getWindowMs()).toBe(60 * 60 * 1000) // 1 hour
        expect(defaultLimiter.getMaxRequests()).toBe(5)
      })
    })

    describe("edge cases", () => {
      it("should handle empty string identifier", () => {
        expect(rateLimiter.check("")).toBe(true)
      })

      it("should handle very long identifiers", () => {
        const longId = "a".repeat(1000)
        expect(rateLimiter.check(longId)).toBe(true)
      })

      it("should handle special characters in identifier", () => {
        const specialId = "user@email.com:192.168.1.1"
        expect(rateLimiter.check(specialId)).toBe(true)
      })

      it("should handle concurrent requests correctly", () => {
        const identifier = "user-123"
        
        // Simulate rapid concurrent requests
        const results = Array(10).fill(null).map(() => rateLimiter.check(identifier))
        
        // First 5 should succeed, rest should fail
        const successCount = results.filter(r => r === true).length
        const failCount = results.filter(r => r === false).length
        
        expect(successCount).toBe(5)
        expect(failCount).toBe(5)
      })
    })
  })
})
