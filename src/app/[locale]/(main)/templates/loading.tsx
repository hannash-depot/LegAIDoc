import { Skeleton } from '@/components/ui/skeleton';

export default function TemplatesLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-2 h-9 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-card text-card-foreground flex h-48 flex-col justify-between rounded-xl border p-6 shadow-sm"
          >
            <div className="space-y-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
