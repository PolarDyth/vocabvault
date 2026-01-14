import { Skeleton } from "@/components/ui/skeleton"

export default function AssistantLoading() {
  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Sidebar Skeleton */}
      <div className="w-64 border-r bg-card/50 flex flex-col">
        <div className="p-3 border-b">
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="p-2 space-y-4">
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <div className="space-y-1">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <div className="space-y-1">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="flex-1 flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-5 w-32" />
        </div>

        {/* Chat Area */}
        <div className="flex-1 rounded-xl border bg-card mb-4 p-4">
          <div className="flex flex-col items-center justify-center h-full">
            <Skeleton className="h-4 w-64 mb-4" />
            <div className="flex gap-2 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-6 w-24 rounded-full" />
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8 w-40" />
              ))}
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-10" />
        </div>
      </main>
    </div>
  )
}
