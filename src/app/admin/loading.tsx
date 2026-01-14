import { Skeleton } from "@/components/ui/skeleton"

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Tabs Skeleton */}
        <div className="mb-6">
          <div className="grid w-full max-w-2xl grid-cols-4 gap-1 rounded-lg bg-muted p-1">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-9 rounded-md" />
            ))}
          </div>
        </div>

        {/* Overview Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-5 rounded" />
              </div>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        {/* Chart/Table Skeleton */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
