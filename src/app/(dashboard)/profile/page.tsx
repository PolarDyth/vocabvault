"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { User, Shield, Palette, Bell, Settings, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { useTheme } from "next-themes"

type Provider = "google" | "github" | "discord"

interface UserIdentity {
  identity_id: string
  id: string
  user_id: string
  identity_data?: Record<string, unknown>
  provider: string
  last_sign_in_at?: string | null
  created_at?: string
  updated_at?: string
}

interface SupabaseUser {
  id: string
  email?: string
  identities?: UserIdentity[]
}

interface UserSettings {
  id: string
  user_id: string
  display_name: string | null
  email_notifications: boolean
  study_reminders: boolean
  weekly_progress_report: boolean
  profile_visible: boolean
  show_activity_status: boolean
  theme: "light" | "dark" | "system"
  daily_goal: number
  flashcard_order: "due_date" | "random" | "alphabetical"
  auto_play_pronunciation: boolean
}

const defaultSettings: Omit<UserSettings, "id" | "user_id"> = {
  display_name: null,
  email_notifications: true,
  study_reminders: true,
  weekly_progress_report: true,
  profile_visible: false,
  show_activity_status: true,
  theme: "system",
  daily_goal: 10,
  flashcard_order: "due_date",
  auto_play_pronunciation: false,
}

export default function ProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [identities, setIdentities] = useState<UserIdentity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Display name state
  const [displayName, setDisplayName] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient()
      
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        if (!user) return

        setUser(user)
        setIdentities(user.identities || [])

        // Get user settings
        const { data: settingsData, error: settingsError } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .single()

        if (settingsError && settingsError.code !== "PGRST116") {
          throw settingsError
        }

        if (settingsData) {
          setSettings(settingsData)
          setDisplayName(settingsData.display_name || "")
        } else {
          // Create default settings if none exist
          const { data: newSettings, error: createError } = await supabase
            .from("user_settings")
            .insert({
              user_id: user.id,
              ...defaultSettings,
            })
            .select()
            .single()

          if (createError) throw createError
          setSettings(newSettings)
          setDisplayName(newSettings?.display_name || "")
        }
      } catch (err) {
        console.error("Error fetching user data:", err)
        setError(err instanceof Error ? err.message : "Failed to load user data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleSaveProfile = async () => {
    if (!user || !settings) return
    const supabase = createClient()
    setIsSaving(true)
    setError(null)
    setSaveSuccess(null)

    try {
      const { error: updateError } = await supabase
        .from("user_settings")
        .update({
          display_name: displayName || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      if (updateError) throw updateError

      setSettings((prev) => prev ? { ...prev, display_name: displayName || null } : null)
      setSaveSuccess("Profile updated successfully!")
      setTimeout(() => setSaveSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user || !settings) return
    const supabase = createClient()
    setIsSaving(true)
    setError(null)
    setSaveSuccess(null)

    try {
      const { error: updateError } = await supabase
        .from("user_settings")
        .update({
          ...newSettings,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      if (updateError) throw updateError

      setSettings((prev) => prev ? { ...prev, ...newSettings } : null)
      setSaveSuccess("Settings saved!")
      setTimeout(() => setSaveSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match")
      return
    }

    // Strong password validation
    const { validatePassword } = await import("@/lib/password-validation")
    const validation = validatePassword(newPassword)
    if (!validation.isValid) {
      setPasswordError(validation.errors.join(". "))
      return
    }

    setIsChangingPassword(true)
    const supabase = createClient()

    try {
      // Re-authenticate with current password for security (if provided)
      // Note: Supabase updateUser works when user has a valid session from password reset flow
      // For additional security, you may want to require current password verification
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      setPasswordSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleConnectProvider = async (provider: Provider) => {
    const supabase = createClient()
    
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
        },
      })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to connect ${provider}`)
    }
  }

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme)
    handleSaveSettings({ theme: newTheme })
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "google":
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )
      case "github":
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        )
      case "discord":
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        )
      default:
        return <User className="h-5 w-5" />
    }
  }

  const isProviderConnected = (provider: string) => {
    return identities.some((id) => id.provider === provider)
  }

  const hasEmailPassword = identities.some((id) => id.provider === "email")
  const hasOAuthProvider = identities.some((id) => 
    id.provider === "google" || id.provider === "github" || id.provider === "discord"
  )

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading profile...
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {saveSuccess && (
        <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-2 text-primary">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {saveSuccess}
        </div>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your display name and profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    {hasOAuthProvider 
                      ? "Your email address is managed through your connected login provider"
                      : "Your email address cannot be changed directly. Use the forgot password option to update your credentials."}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="Enter your display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    This is how your name will appear across the app
                  </p>
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          {/* Connected Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                Manage your connected login providers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(["google", "github", "discord"] as Provider[]).map((provider) => {
                const connected = isProviderConnected(provider)
                const identity = identities.find((id) => id.provider === provider)
                
                return (
                  <div
                    key={provider}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className={connected ? "text-foreground" : "text-muted-foreground"}>
                        {getProviderIcon(provider)}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{provider}</p>
                        {connected && identity?.identity_data?.email ? (
                          <p className="text-sm text-muted-foreground">
                            {String(identity.identity_data.email)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {connected ? (
                      <div className="flex items-center gap-2 text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Connected</span>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConnectProvider(provider)}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                {hasEmailPassword
                  ? "Update your password for email login"
                  : "You signed up with a social provider. Set a password to enable email login."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {passwordSuccess && (
                <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  Password updated successfully!
                </div>
              )}
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}
                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how VocabVault looks for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Theme</Label>
                {mounted && (
                  <div className="grid grid-cols-3 gap-4">
                    {(["light", "dark", "system"] as const).map((themeOption) => (
                      <button
                        key={themeOption}
                        onClick={() => handleThemeChange(themeOption)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          theme === themeOption
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          {themeOption === "light" && (
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 shadow-lg" />
                          )}
                          {themeOption === "dark" && (
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 shadow-lg border border-slate-600" />
                          )}
                          {themeOption === "system" && (
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-300 via-slate-400 to-slate-700 shadow-lg" />
                          )}
                          <span className="text-sm font-medium capitalize">
                            {themeOption}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you&apos;d like to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email updates about your activity
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings?.email_notifications ?? true}
                    onCheckedChange={(checked) =>
                      handleSaveSettings({ email_notifications: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="study-reminders">Study Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminded to review your flashcards
                    </p>
                  </div>
                  <Switch
                    id="study-reminders"
                    checked={settings?.study_reminders ?? true}
                    onCheckedChange={(checked) =>
                      handleSaveSettings({ study_reminders: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="weekly-report">Weekly Progress Report</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a weekly summary of your learning progress
                    </p>
                  </div>
                  <Switch
                    id="weekly-report"
                    checked={settings?.weekly_progress_report ?? true}
                    onCheckedChange={(checked) =>
                      handleSaveSettings({ weekly_progress_report: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Study Settings */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Study Settings
              </CardTitle>
              <CardDescription>
                Customize your learning experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="daily-goal">Daily Word Goal</Label>
                  <Input
                    id="daily-goal"
                    type="number"
                    min={1}
                    max={100}
                    value={settings?.daily_goal ?? 10}
                    onChange={(e) => {
                      const value = Math.max(1, Math.min(100, parseInt(e.target.value) || 10))
                      handleSaveSettings({ daily_goal: value })
                    }}
                    className="w-24"
                  />
                  <p className="text-sm text-muted-foreground">
                    How many new words you want to learn each day
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-pronunciation">Auto-play Pronunciation</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically play word pronunciation in flashcards
                    </p>
                  </div>
                  <Switch
                    id="auto-pronunciation"
                    checked={settings?.auto_play_pronunciation ?? false}
                    onCheckedChange={(checked) =>
                      handleSaveSettings({ auto_play_pronunciation: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
