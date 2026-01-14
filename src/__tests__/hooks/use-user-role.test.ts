import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"

// Mock user data
const mockUser = { id: "user-123", email: "test@example.com" }
const mockAdminProfile = { role: "admin", status: "active" }
const mockModeratorProfile = { role: "moderator", status: "active" }
const mockUserProfile = { role: "user", status: "active" }
const mockSuspendedProfile = { role: "user", status: "suspended" }

// Mock Supabase client
const mockGetUser = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()

const mockSupabaseClient = {
  auth: {
    getUser: mockGetUser,
  },
  from: vi.fn(() => ({
    select: mockSelect,
  })),
}

vi.mock("@/utils/supabase/client", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

// Import after mocking
import { useUserRole, useIsAdmin, useHasElevatedPrivileges } from "@/hooks/use-user-role"

describe("User Role and Permissions Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup chain mocks
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ single: mockSingle })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("useUserRole", () => {
    describe("when user is not logged in", () => {
      beforeEach(() => {
        mockGetUser.mockResolvedValue({ data: { user: null } })
      })

      it("should return null role", async () => {
        const { result } = renderHook(() => useUserRole())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.role).toBe(null)
        expect(result.current.userId).toBe(null)
      })

      it("should not be admin", async () => {
        const { result } = renderHook(() => useUserRole())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.isAdmin).toBe(false)
      })

      it("should not have elevated privileges", async () => {
        const { result } = renderHook(() => useUserRole())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.hasElevatedPrivileges).toBe(false)
      })
    })

    describe("when user is an admin", () => {
      beforeEach(() => {
        mockGetUser.mockResolvedValue({ data: { user: mockUser } })
        mockSingle.mockResolvedValue({ data: mockAdminProfile, error: null })
      })

      it("should return admin role", async () => {
        const { result } = renderHook(() => useUserRole())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.role).toBe("admin")
      })

      it("should have isAdmin=true", async () => {
        const { result } = renderHook(() => useUserRole())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.isAdmin).toBe(true)
      })

      it("should have elevated privileges", async () => {
        const { result } = renderHook(() => useUserRole())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.hasElevatedPrivileges).toBe(true)
      })

      it("should have active status", async () => {
        const { result } = renderHook(() => useUserRole())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.status).toBe("active")
        expect(result.current.isActive).toBe(true)
      })
    })

    describe("when user is a moderator", () => {
      beforeEach(() => {
        mockGetUser.mockResolvedValue({ data: { user: mockUser } })
        mockSingle.mockResolvedValue({ data: mockModeratorProfile, error: null })
      })

      it("should return moderator role", async () => {
        const { result } = renderHook(() => useUserRole())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.role).toBe("moderator")
      })

      it("should have isModerator=true", async () => {
        const { result } = renderHook(() => useUserRole())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.isModerator).toBe(true)
      })

      it("should not be admin", async () => {
        const { result } = renderHook(() => useUserRole())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.isAdmin).toBe(false)
      })

      it("should have elevated privileges", async () => {
        const { result } = renderHook(() => useUserRole())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.hasElevatedPrivileges).toBe(true)
      })
    })

    describe("when user is a regular user", () => {
      beforeEach(() => {
        mockGetUser.mockResolvedValue({ data: { user: mockUser } })
        mockSingle.mockResolvedValue({ data: mockUserProfile, error: null })
      })

      it("should return user role", async () => {
        const { result } = renderHook(() => useUserRole())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.role).toBe("user")
      })

      it("should not be admin", async () => {
        const { result } = renderHook(() => useUserRole())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.isAdmin).toBe(false)
      })

      it("should not have elevated privileges", async () => {
        const { result } = renderHook(() => useUserRole())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.hasElevatedPrivileges).toBe(false)
      })

      it("should return userId", async () => {
        const { result } = renderHook(() => useUserRole())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.userId).toBe("user-123")
      })
    })

    describe("when user profile does not exist", () => {
      beforeEach(() => {
        mockGetUser.mockResolvedValue({ data: { user: mockUser } })
        mockSingle.mockResolvedValue({
          data: null,
          error: { code: "PGRST116" }, // No rows found
        })
      })

      it("should default to user role", async () => {
        const { result } = renderHook(() => useUserRole())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.role).toBe("user")
      })

      it("should default to active status", async () => {
        const { result } = renderHook(() => useUserRole())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.status).toBe("active")
      })
    })

    describe("when user is suspended", () => {
      beforeEach(() => {
        mockGetUser.mockResolvedValue({ data: { user: mockUser } })
        mockSingle.mockResolvedValue({ data: mockSuspendedProfile, error: null })
      })

      it("should have isActive=false", async () => {
        const { result } = renderHook(() => useUserRole())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.isActive).toBe(false)
        expect(result.current.status).toBe("suspended")
      })
    })

    describe("error handling", () => {
      it("should set error on profile fetch failure", async () => {
        mockGetUser.mockResolvedValue({ data: { user: mockUser } })
        mockSingle.mockResolvedValue({
          data: null,
          error: { code: "OTHER_ERROR", message: "Database error" },
        })

        const { result } = renderHook(() => useUserRole())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.error).toBeTruthy()
        expect(result.current.role).toBe(null)
      })
    })

    describe("refetch", () => {
      it("should refetch role when called", async () => {
        mockGetUser.mockResolvedValue({ data: { user: mockUser } })
        mockSingle.mockResolvedValue({ data: mockUserProfile, error: null })

        const { result } = renderHook(() => useUserRole())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        expect(mockGetUser).toHaveBeenCalledTimes(1)

        // Trigger refetch
        act(() => {
          result.current.refetch()
        })

        await waitFor(() => {
          expect(mockGetUser).toHaveBeenCalledTimes(2)
        })
      })
    })

    describe("loading state", () => {
      it("should start with isLoading=true", () => {
        mockGetUser.mockResolvedValue({ data: { user: mockUser } })
        mockSingle.mockResolvedValue({ data: mockUserProfile, error: null })

        const { result } = renderHook(() => useUserRole())

        expect(result.current.isLoading).toBe(true)
      })

      it("should set isLoading=false after fetch", async () => {
        mockGetUser.mockResolvedValue({ data: { user: mockUser } })
        mockSingle.mockResolvedValue({ data: mockUserProfile, error: null })

        const { result } = renderHook(() => useUserRole())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })
      })
    })
  })

  describe("useIsAdmin", () => {
    it("should return isAdmin=true for admin user", async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })
      mockSingle.mockResolvedValue({ data: mockAdminProfile, error: null })

      const { result } = renderHook(() => useIsAdmin())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isAdmin).toBe(true)
    })

    it("should return isAdmin=false for regular user", async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })
      mockSingle.mockResolvedValue({ data: mockUserProfile, error: null })

      const { result } = renderHook(() => useIsAdmin())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isAdmin).toBe(false)
    })

    it("should return isAdmin=false for moderator", async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })
      mockSingle.mockResolvedValue({ data: mockModeratorProfile, error: null })

      const { result } = renderHook(() => useIsAdmin())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isAdmin).toBe(false)
    })
  })

  describe("useHasElevatedPrivileges", () => {
    it("should return true for admin", async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })
      mockSingle.mockResolvedValue({ data: mockAdminProfile, error: null })

      const { result } = renderHook(() => useHasElevatedPrivileges())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasElevatedPrivileges).toBe(true)
    })

    it("should return true for moderator", async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })
      mockSingle.mockResolvedValue({ data: mockModeratorProfile, error: null })

      const { result } = renderHook(() => useHasElevatedPrivileges())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasElevatedPrivileges).toBe(true)
    })

    it("should return false for regular user", async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } })
      mockSingle.mockResolvedValue({ data: mockUserProfile, error: null })

      const { result } = renderHook(() => useHasElevatedPrivileges())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasElevatedPrivileges).toBe(false)
    })
  })
})
