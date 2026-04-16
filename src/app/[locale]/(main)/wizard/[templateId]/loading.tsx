import { Skeleton } from '@/components/ui/skeleton';

export default function WizardLoading() {
  return (
    <div className="space-y-8">
      {/* Header: title + progress bar */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Form card */}
      <div className="bg-card space-y-6 rounded-xl border p-6">
        {/* Section title */}
        <Skeleton className="h-6 w-40" />

        {/* Form fields */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}

        {/* Textarea field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-24 w-full rounded-md" />
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Skeleton className="h-11 w-28 rounded-md" />
        <Skeleton className="h-11 w-28 rounded-md" />
      </div>
    </div>
  );
}
