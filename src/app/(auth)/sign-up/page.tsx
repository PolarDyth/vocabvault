"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { BrandLogo } from "@/components/brand-logo"
import { createClient } from "@/utils/supabase/client"
import { OAuthButtons } from "@/components/auth/oauth-buttons"
import { ShieldCheck, ChevronDown, ChevronUp, Mail } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    // Import and validate password strength
    const { validatePassword } = await import("@/lib/password-validation")
    const validation = validatePassword(password)
    if (!validation.isValid) {
      setError(validation.errors.join(". "))
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/`,
        },
      })
      if (error) throw error
      router.push("/sign-up-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex justify-center mb-4">
            <BrandLogo size="lg" showTagline href="/" />
          </div>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Create your vault</CardTitle>
              <CardDescription>Start building your vocabulary today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Security message */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Sign up with a provider for instant access—no password to remember.
                </p>
              </div>

              {/* OAuth Buttons - Primary focus */}
              <OAuthButtons mode="signup" />

              {/* Collapsible email/password section */}
              <Collapsible open={showEmailForm} onOpenChange={setShowEmailForm}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full text-muted-foreground hover:text-foreground gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Sign up with email instead
                    {showEmailForm ? (
                      <ChevronUp className="h-4 w-4 ml-auto" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-dashed" />
                    </div>
                  </div>
                  <form onSubmit={handleSignUp}>
                    <div className="flex flex-col gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="email" className="text-sm">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="password" className="text-sm">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="repeat-password" className="text-sm">Confirm Password</Label>
                        <Input
                          id="repeat-password"
                          type="password"
                          required
                          value={repeatPassword}
                          onChange={(e) => setRepeatPassword(e.target.value)}
                        />
                      </div>
                      {error && <p className="text-sm text-destructive">{error}</p>}
                      <Button type="submit" variant="secondary" className="w-full" disabled={isLoading}>
                        {isLoading ? "Creating vault..." : "Create Vault with Email"}
                      </Button>
                    </div>
                  </form>
                </CollapsibleContent>
              </Collapsible>

              {/* Sign in link */}
              <div className="text-center text-sm border-t pt-4">
                {"Already have an account? "}
                <Link href="/login" className="text-primary underline underline-offset-4 hover:text-primary/80">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
