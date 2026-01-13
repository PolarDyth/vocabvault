"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BookOpen, GraduationCap, Sparkles, LogOut, User, Shield, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { BrandLogo } from "@/components/brand-logo"
import { createClient } from "@/utils/supabase/client"
import { useAIFeature } from "@/hooks/use-ai-features"
import { useIsAdmin } from "@/hooks/use-user-role"

export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  // Hooks must be called unconditionally at the top
  const { isEnabled: hasAIAssistantEnabled } = useAIFeature("assistant")
  const { isAdmin } = useIsAdmin()

  // Prevent hydration mismatch by only showing dynamic content after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const allNavItems = [
    { href: "/", label: "Dictionary", icon: BookOpen },
    { href: "/flashcards", label: "Flashcards", icon: GraduationCap },
    { href: "/assistant", label: "AI Assistant", icon: Sparkles },
  ]

  // Filter nav items based on AI features availability (only after mount to prevent hydration mismatch)
  const navItems = allNavItems.filter((item) => {
    if (item.href === "/assistant") {
      return mounted && hasAIAssistantEnabled
    }
    return true
  })

  // Only show admin/AI features after client mount to prevent hydration mismatch
  const showAdmin = mounted && isAdmin
  const showAIAssistant = mounted && hasAIAssistantEnabled

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <BrandLogo size="sm" href="/" />
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("gap-2", pathname === item.href && "bg-accent text-accent-foreground")}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile navigation */}
          <nav className="flex md:hidden items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(pathname === item.href && "bg-accent text-accent-foreground")}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Button>
              </Link>
            ))}
          </nav>

          {/* Only render DropdownMenu after mount to prevent hydration mismatch with Radix UI IDs */}
          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild className="md:hidden">
                  <Link href="/dictionary" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Dictionary
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="md:hidden">
                  <Link href="/flashcards" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Flashcards
                  </Link>
                </DropdownMenuItem>
                {showAIAssistant && (
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link href="/assistant" className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI Assistant
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="md:hidden" />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                {showAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Placeholder to prevent layout shift
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
              <span className="sr-only">User menu</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
