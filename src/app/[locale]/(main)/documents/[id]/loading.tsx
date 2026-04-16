import { Skeleton } from '@/components/ui/skeleton';

export default function DocumentDetailLoading() {
  return (
    <div className="space-y-8">
      {/* Header row: back button + title + status */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div>
            <Skeleton className="mb-2 h-8 w-56" />
            <Skeleton className="h-5 w-36" />
          </div>
        </div>
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>

      {/* Metadata card */}
      <div className="bg-card rounded-xl border p-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
          ))}
        </div>
      </div>

      {/* Contract body card */}
      <div className="bg-card space-y-4 rounded-xl border p-6">
        <Skeleton className="mb-4 h-6 w-32" />
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-4 rounded" style={{ width: `${85 + ((i * 7) % 15)}%` }} />
        ))}
      </div>

      {/* Actions row */}
      <div className="flex gap-3">
        <Skeleton className="h-11 w-40 rounded-md" />
        <Skeleton className="h-11 w-32 rounded-md" />
      </div>
    </div>
  );
}
