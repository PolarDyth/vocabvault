"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import type { UserRole, UserStatus } from "@/lib/types"

interface UserRoleState {
  /** The user's role */
  role: UserRole | null
  /** The user's status */
  status: UserStatus | null
  /** Whether the user is an admin */
  isAdmin: boolean
  /** Whether the user is a moderator */
  isModerator: boolean
  /** Whether the user has elevated privileges (admin or moderator) */
  hasElevatedPrivileges: boolean
  /** Whether the user's account is active */
  isActive: boolean
  /** Whether the role is still loading */
  isLoading: boolean
  /** Any error that occurred during fetching */
  error: string | null
  /** The user's ID */
  userId: string | null
  /** Refetch the role (useful after updates) */
  refetch: () => void
}

/**
 * Hook to check the current user's role and permissions.
 */
export function useUserRole(): UserRoleState {
  const [role, setRole] = useState<UserRole | null>(null)
  const [status, setStatus] = useState<UserStatus | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true

    async function fetchRole() {
      if (!isMounted.current) return
      
      setIsLoading(true)
      setError(null)

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!isMounted.current) return

      if (!user) {
        setRole(null)
        setStatus(null)
        setUserId(null)
        setIsLoading(false)
        return
      }

      setUserId(user.id)

      try {
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("role, status")
          .eq("user_id", user.id)
          .single()

        if (!isMounted.current) return

        if (profileError) {
          // If no profile exists, user is a regular user
          if (profileError.code === "PGRST116") {
            setRole("user")
            setStatus("active")
          } else {
            throw profileError
          }
        } else if (profile) {
          setRole(profile.role as UserRole)
          setStatus(profile.status as UserStatus)
        }
      } catch (err) {
        console.error("Error fetching user role:", err)
        if (isMounted.current) {
          setError(err instanceof Error ? err.message : "Failed to load user role")
          setRole(null)
          setStatus(null)
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false)
        }
      }
    }

    fetchRole()

    return () => {
      isMounted.current = false
    }
  }, [refetchTrigger])

  const refetch = () => setRefetchTrigger((n) => n + 1)

  const isAdmin = role === "admin"
  const isModerator = role === "moderator"
  const hasElevatedPrivileges = isAdmin || isModerator
  const isActive = status === "active"

  return {
    role,
    status,
    isAdmin,
    isModerator,
    hasElevatedPrivileges,
    isActive,
    isLoading,
    error,
    userId,
    refetch,
  }
}

/**
 * Simple check if the current user is an admin.
 * @returns Object with isAdmin status and loading state
 */
export function useIsAdmin() {
  const { isAdmin, isLoading, error, refetch } = useUserRole()

  return {
    isAdmin,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Check if the current user has elevated privileges (admin or moderator).
 * @returns Object with hasElevatedPrivileges status and loading state
 */
export function useHasElevatedPrivileges() {
  const { hasElevatedPrivileges, isLoading, error, refetch } = useUserRole()

  return {
    hasElevatedPrivileges,
    isLoading,
    error,
    refetch,
  }
}
