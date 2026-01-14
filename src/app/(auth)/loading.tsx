import { Skeleton } from "@/components/ui/skeleton"

export default function AuthLoading() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Card */}
        <div className="rounded-xl border bg-card p-6 space-y-6">
          {/* Header */}
          <div className="space-y-2 text-center">
            <Skeleton className="h-7 w-32 mx-auto" />
            <Skeleton className="h-4 w-56 mx-auto" />
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-px flex-1" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-px flex-1" />
          </div>

          {/* Email/Password Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center">
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    </div>
  )
}
