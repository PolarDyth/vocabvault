import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { rateLimitConfigs } from "@/lib/rate-limit"

// Mock the Supabase client
const mockRpc = vi.fn()
const mockSupabaseClient = {
  rpc: mockRpc,
} as unknown as import("@supabase/supabase-js").SupabaseClient

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}))

// Import after mocking
import { checkRateLimit, checkRateLimitWithClient } from "@/lib/rate-limit"

describe("Supabase Rate Limiter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("rateLimitConfigs", () => {
    it("should have correct assistant config", () => {
      expect(rateLimitConfigs.assistant).toEqual({
        maxRequests: 5,
        windowSeconds: 60,
        failOpen: false,
      })
    })

    it("should have correct examples config", () => {
      expect(rateLimitConfigs.examples).toEqual({
        maxRequests: 10,
        windowSeconds: 60,
        failOpen: false,
      })
    })

    it("should have correct dictionary config", () => {
      expect(rateLimitConfigs.dictionary).toEqual({
        maxRequests: 30,
        windowSeconds: 60,
        failOpen: true,
      })
    })

    it("should have correct general config", () => {
      expect(rateLimitConfigs.general).toEqual({
        maxRequests: 100,
        windowSeconds: 60,
        failOpen: true,
      })
    })

    it("should have correct auth config", () => {
      expect(rateLimitConfigs.auth).toEqual({
        maxRequests: 5,
        windowSeconds: 60,
        failOpen: false,
      })
    })

    it("should have failOpen=false for sensitive endpoints", () => {
      expect(rateLimitConfigs.assistant.failOpen).toBe(false)
      expect(rateLimitConfigs.examples.failOpen).toBe(false)
      expect(rateLimitConfigs.auth.failOpen).toBe(false)
    })

    it("should have failOpen=true for non-sensitive endpoints", () => {
      expect(rateLimitConfigs.dictionary.failOpen).toBe(true)
      expect(rateLimitConfigs.general.failOpen).toBe(true)
    })
  })

  describe("checkRateLimitWithClient", () => {
    it("should return success when under limit", async () => {
      mockRpc.mockResolvedValue({
        data: { success: true, remaining: 4, reset_in: 55 },
        error: null,
      })

      const result = await checkRateLimitWithClient(
        mockSupabaseClient,
        "user-123",
        "assistant",
        { maxRequests: 5, windowSeconds: 60, failOpen: false }
      )

      expect(result).toEqual({
        success: true,
        remaining: 4,
        resetIn: 55,
      })
    })

    it("should return failure when over limit", async () => {
      mockRpc.mockResolvedValue({
        data: { success: false, remaining: 0, reset_in: 30 },
        error: null,
      })

      const result = await checkRateLimitWithClient(
        mockSupabaseClient,
        "user-123",
        "assistant",
        { maxRequests: 5, windowSeconds: 60, failOpen: false }
      )

      expect(result).toEqual({
        success: false,
        remaining: 0,
        resetIn: 30,
      })
    })

    it("should call rpc with correct parameters", async () => {
      mockRpc.mockResolvedValue({
        data: { success: true, remaining: 9, reset_in: 60 },
        error: null,
      })

      await checkRateLimitWithClient(
        mockSupabaseClient,
        "user-456",
        "examples",
        { maxRequests: 10, windowSeconds: 60, failOpen: false }
      )

      expect(mockRpc).toHaveBeenCalledWith("check_rate_limit", {
        p_identifier: "user-456",
        p_endpoint: "examples",
        p_max_requests: 10,
        p_window_seconds: 60,
      })
    })

    describe("failOpen behavior", () => {
      it("should fail open when failOpen=true and RPC errors", async () => {
        mockRpc.mockResolvedValue({
          data: null,
          error: new Error("Database error"),
        })

        const result = await checkRateLimitWithClient(
          mockSupabaseClient,
          "user-123",
          "dictionary",
          { maxRequests: 30, windowSeconds: 60, failOpen: true }
        )

        expect(result.success).toBe(true)
        expect(result.remaining).toBe(30)
      })

      it("should fail closed when failOpen=false and RPC errors", async () => {
        mockRpc.mockResolvedValue({
          data: null,
          error: new Error("Database error"),
        })

        const result = await checkRateLimitWithClient(
          mockSupabaseClient,
          "user-123",
          "assistant",
          { maxRequests: 5, windowSeconds: 60, failOpen: false }
        )

        expect(result.success).toBe(false)
        expect(result.remaining).toBe(0)
      })

      it("should fail open by default when failOpen is undefined", async () => {
        mockRpc.mockResolvedValue({
          data: null,
          error: new Error("Database error"),
        })

        const result = await checkRateLimitWithClient(
          mockSupabaseClient,
          "user-123",
          "general",
          { maxRequests: 100, windowSeconds: 60 }
        )

        expect(result.success).toBe(true)
      })

      it("should fail closed when RPC returns null data", async () => {
        mockRpc.mockResolvedValue({
          data: null,
          error: null,
        })

        const result = await checkRateLimitWithClient(
          mockSupabaseClient,
          "user-123",
          "auth",
          { maxRequests: 5, windowSeconds: 60, failOpen: false }
        )

        expect(result.success).toBe(false)
      })

      it("should fail closed when RPC throws exception", async () => {
        mockRpc.mockRejectedValue(new Error("Network error"))

        const result = await checkRateLimitWithClient(
          mockSupabaseClient,
          "user-123",
          "assistant",
          { maxRequests: 5, windowSeconds: 60, failOpen: false }
        )

        expect(result.success).toBe(false)
        expect(result.remaining).toBe(0)
      })
    })
  })

  describe("checkRateLimit", () => {
    it("should create client and call RPC", async () => {
      mockRpc.mockResolvedValue({
        data: { success: true, remaining: 4, reset_in: 60 },
        error: null,
      })

      const result = await checkRateLimit(
        "user-123",
        "assistant",
        { maxRequests: 5, windowSeconds: 60, failOpen: false }
      )

      expect(result.success).toBe(true)
      expect(mockRpc).toHaveBeenCalled()
    })
  })
})
