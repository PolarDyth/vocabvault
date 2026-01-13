import { cn } from "@/lib/utils"
import Link from "next/link"

interface BrandLogoProps {
  size?: "sm" | "md" | "lg"
  showTagline?: boolean
  href?: string
  className?: string
}

export function BrandLogo({ size = "md", showTagline = false, href = "/", className }: BrandLogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  }

  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  const content = (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Logo Icon - Vault/Book hybrid */}
      <div className={cn("relative flex items-center justify-center rounded-lg bg-primary", iconSizes[size])}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-[60%] h-[60%] text-primary-foreground"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Book/vault shape */}
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          {/* V letter inside */}
          <path d="M9 8l3 5 3-5" strokeWidth="2.5" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className={cn("font-semibold tracking-tight text-foreground", sizeClasses[size])}>
          Vocab<span className="text-primary">Vault</span>
        </span>
        {showTagline && <span className="text-xs text-muted-foreground">Your Words, Your Way</span>}
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
