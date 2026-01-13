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

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/")
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
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Sign in to access your vocabulary vault</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Security message */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Sign in with a provider for faster, more secure access—no password needed.
                </p>
              </div>

              {/* OAuth Buttons - Primary focus */}
              <OAuthButtons mode="login" />

              {/* Collapsible email/password section */}
              <Collapsible open={showEmailForm} onOpenChange={setShowEmailForm}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full text-muted-foreground hover:text-foreground gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Continue with email instead
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
                  <form onSubmit={handleLogin}>
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
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password" className="text-sm">Password</Label>
                          <Link
                            href="/forgot-password"
                            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-primary"
                          >
                            Forgot password?
                          </Link>
                        </div>
                        <Input
                          id="password"
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      {error && <p className="text-sm text-destructive">{error}</p>}
                      <Button type="submit" variant="secondary" className="w-full" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign In with Email"}
                      </Button>
                    </div>
                  </form>
                </CollapsibleContent>
              </Collapsible>

              {/* Sign up link */}
              <div className="text-center text-sm border-t pt-4">
                {"Don't have an account? "}
                <Link href="/sign-up" className="text-primary underline underline-offset-4 hover:text-primary/80">
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
