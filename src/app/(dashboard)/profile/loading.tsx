import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex gap-1 rounded-lg bg-muted p-1">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-md" />
          ))}
        </div>
      </div>

      {/* Profile Card Skeleton */}
      <div className="rounded-xl border bg-card">
        <div className="p-6 space-y-1.5 border-b">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="p-6 space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-3 w-96" />
          </div>
          
          {/* Display Name Field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-3 w-72" />
          </div>

          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  )
}
