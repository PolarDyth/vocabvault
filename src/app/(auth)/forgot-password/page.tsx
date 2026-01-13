"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { BrandLogo } from "@/components/brand-logo"
import { createClient } from "@/utils/supabase/client"
import { ArrowLeft, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      })
      if (error) throw error
      setIsSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

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
                <CardTitle className="text-2xl">Check your email</CardTitle>
                <CardDescription>
                  We&apos;ve sent a password reset link to <strong>{email}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Click the link in the email to reset your password. If you don&apos;t see it, check your spam folder.
                </p>
                <Link href="/login">
                  <Button variant="outline" className="w-full gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                  </Button>
                </Link>
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
              <CardTitle className="text-2xl">Forgot password?</CardTitle>
              <CardDescription>
                Enter your email and we&apos;ll send you a link to reset your password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  <Link href="/login" className="underline underline-offset-4 hover:text-primary inline-flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3" />
                    Back to login
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
