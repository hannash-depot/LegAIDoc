import { Skeleton } from '@/components/ui/skeleton';

export default function DocumentsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="mb-2 h-9 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
      </div>

      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-card text-card-foreground flex h-32 flex-col justify-between rounded-xl border p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="w-full max-w-sm space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="flex justify-end space-x-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
