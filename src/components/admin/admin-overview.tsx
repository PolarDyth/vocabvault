"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, Brain, Activity } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

interface Stats {
  totalUsers: number
  activeUsers: number
  totalWords: number
  aiFeatureCount: number
}

export function AdminOverview() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalWords: 0,
    aiFeatureCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient()

      try {
        let totalUsers = 0
        let activeUsers = 0
        let totalWords = 0
        let aiFeatureCount = 0

        // Try to get user profiles count
        const usersResult = await supabase.from("user_profiles").select("*", { count: "exact", head: true })

        if (!usersResult.error) {
          totalUsers = usersResult.count || 0

          const activeResult = await supabase
            .from("user_profiles")
            .select("*", { count: "exact", head: true })
            .eq("status", "active")

          if (!activeResult.error) {
            activeUsers = activeResult.count || 0
          }
        }

        // Get total words count using admin function (bypasses RLS)
        const { data: wordsCountData, error: wordsError } = await supabase.rpc("get_total_words_count")

        if (!wordsError && wordsCountData !== null) {
          totalWords = wordsCountData
        }

        // Try to get AI features count
        const featuresResult = await supabase
          .from("ai_feature_settings")
          .select("*", { count: "exact", head: true })
          .eq("enabled", true)

        if (!featuresResult.error) {
          aiFeatureCount = featuresResult.count || 0
        }

        setStats({
          totalUsers,
          activeUsers,
          totalWords,
          aiFeatureCount,
        })
      } catch (err) {
        console.error("Error fetching stats:", err)
        setError("Failed to load statistics. Please run the database migrations.")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      description: "Registered accounts",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Active Users",
      value: stats.activeUsers,
      description: "Currently active",
      icon: Activity,
      color: "text-chart-2",
    },
    {
      title: "Total Words",
      value: stats.totalWords,
      description: "Across all users",
      icon: BookOpen,
      color: "text-chart-3",
    },
    {
      title: "AI Features",
      value: stats.aiFeatureCount,
      description: "Enabled features",
      icon: Brain,
      color: "text-chart-4",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Dashboard Overview</h2>
        <p className="text-sm text-muted-foreground">Quick stats and application health</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stat.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Activity feed will show recent user registrations, word additions, and admin actions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Application health indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Database Connection</span>
              <span className="flex items-center gap-2 text-sm text-chart-2">
                <span className="h-2 w-2 rounded-full bg-chart-2" />
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">AI Services</span>
              <span className="flex items-center gap-2 text-sm text-chart-2">
                <span className="h-2 w-2 rounded-full bg-chart-2" />
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Authentication</span>
              <span className="flex items-center gap-2 text-sm text-chart-2">
                <span className="h-2 w-2 rounded-full bg-chart-2" />
                Active
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="text-red-500 text-center">
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}
