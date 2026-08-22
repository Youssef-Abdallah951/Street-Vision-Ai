import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} />
}

export function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-surface-200/70 p-4 dark:border-surface-800">
      <Skeleton className="aspect-video w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-surface-200/70 bg-white p-5 dark:border-surface-800 dark:bg-surface-900">
      <Skeleton className="h-12 w-12 rounded-xl" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-14" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}
