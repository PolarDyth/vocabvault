import { NextRequest, NextResponse } from "next/server"
import { Octokit } from "@octokit/rest"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"

// Rate limiting for feedback submissions
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour
const MAX_SUBMISSIONS_PER_WINDOW = 5
const submissionTracker = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const tracker = submissionTracker.get(identifier)

  if (!tracker || now > tracker.resetAt) {
    submissionTracker.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (tracker.count >= MAX_SUBMISSIONS_PER_WINDOW) {
    return false
  }

  tracker.count++
  return true
}

// Sanitize user input to prevent injection
function sanitizeInput(input: string, maxLength: number = 10000): string {
  return input
    .slice(0, maxLength)
    .replace(/[<>]/g, "") // Remove potential HTML/script tags
    .trim()
}

export async function POST(req: NextRequest) {
  try {
    // Check for GitHub token
    const githubToken = process.env.GITHUB_FEEDBACK_TOKEN
    if (!githubToken) {
      console.error("GITHUB_FEEDBACK_TOKEN not configured")
      return NextResponse.json(
        { error: "Feedback system not configured" },
        { status: 503 }
      )
    }

    // Get user info for rate limiting
    const supabase = await createClient(cookies())
    const { data: { user } } = await supabase.auth.getUser()
    
    // Use user ID or IP for rate limiting
    const rateLimitKey = user?.id || 
      req.headers.get("x-forwarded-for")?.split(",")[0] || 
      "anonymous"
    
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { error: "Too many feedback submissions. Please try again later." },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const { type, title, description, email } = body

    // Validate required fields
    if (!type || !title || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate type
    if (!["bug", "feature", "feedback"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid feedback type" },
        { status: 400 }
      )
    }

    // Validate lengths
    if (title.length > 200) {
      return NextResponse.json(
        { error: "Title too long (max 200 characters)" },
        { status: 400 }
      )
    }

    if (description.length > 10000) {
      return NextResponse.json(
        { error: "Description too long (max 10000 characters)" },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(title, 200)
    const sanitizedDescription = sanitizeInput(description, 10000)
    const sanitizedEmail = email ? sanitizeInput(email, 100) : null

    // Format issue title with type prefix
    const typeLabels: Record<string, string> = {
      bug: "🐛 Bug",
      feature: "💡 Feature Request",
      feedback: "💬 Feedback",
    }
    const issueTitle = `[${typeLabels[type]}] ${sanitizedTitle}`

    // Format issue body
    const issueBody = `## Description
${sanitizedDescription}

---

### Metadata
- **Type:** ${typeLabels[type]}
- **Submitted by:** ${user ? `User (${user.id.slice(0, 8)}...)` : "Anonymous"}
${sanitizedEmail ? `- **Contact:** ${sanitizedEmail}` : ""}
- **Submitted at:** ${new Date().toISOString()}
- **User Agent:** ${req.headers.get("user-agent") || "Unknown"}

---
*This issue was automatically created via the VocabVault feedback form.*`

    // Create GitHub issue
    const octokit = new Octokit({ auth: githubToken })
    
    const labelMap: Record<string, string[]> = {
      bug: ["bug", "user-reported"],
      feature: ["enhancement", "user-reported"],
      feedback: ["feedback", "user-reported"],
    }

    await octokit.rest.issues.create({
      owner: "PolarDyth",
      repo: "vocabvault",
      title: issueTitle,
      body: issueBody,
      labels: labelMap[type],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Feedback submission error:", error)
    return NextResponse.json(
      { error: "Failed to submit feedback. Please try again." },
      { status: 500 }
    )
  }
}
