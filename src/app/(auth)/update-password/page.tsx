"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { BrandLogo } from "@/components/brand-logo"
import { createClient } from "@/utils/supabase/client"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { validatePassword } from "@/lib/password-validation"

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      // User should have a session from the recovery link
      if (session) {
        setIsValidSession(true)
      } else {
        setIsValidSession(false)
      }
    }
    
    checkSession()
  }, [])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    // Strong password validation
    const validation = validatePassword(password)
    if (!validation.isValid) {
      setError(validation.errors.join(". "))
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })
      if (error) throw error
      setIsSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
        <div className="w-full max-w-sm">
          <div className="flex flex-col gap-6">
            <div className="flex justify-center mb-4">
              <BrandLogo size="lg" showTagline href="/" />
            </div>
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Verifying reset link...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Invalid or expired session
  if (isValidSession === false) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
        <div className="w-full max-w-sm">
          <div className="flex flex-col gap-6">
            <div className="flex justify-center mb-4">
              <BrandLogo size="lg" showTagline href="/" />
            </div>
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Invalid or expired link</CardTitle>
                <CardDescription>
                  This password reset link is invalid or has expired.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/forgot-password">
                  <Button className="w-full">Request a new reset link</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
        <div className="w-full max-w-sm">
          <div className="flex flex-col gap-6">
            <div className="flex justify-center mb-4">
              <BrandLogo size="lg" showTagline href="/" />
            </div>
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle2 className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-2xl">Password updated!</CardTitle>
                <CardDescription>
                  Your password has been successfully updated.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => router.push("/")}>
                  Continue to app
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex justify-center mb-4">
            <BrandLogo size="lg" showTagline href="/" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Set new password</CardTitle>
              <CardDescription>
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
