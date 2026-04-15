import { Users } from "lucide-react";

export default function Loading() {
  return (
    <div className="space-y-10 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="w-32 h-6 bg-accent/10 border border-accent/20 rounded-full" />
          <div className="w-64 h-10 bg-surface-dim rounded-2xl" />
          <div className="w-full max-w-xl h-4 bg-surface-dim rounded-lg" />
        </div>
        <div className="w-40 h-12 bg-surface-dim rounded-2xl" />
      </div>

      {/* Usage Indicator Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-surface/40 border border-border-soft h-32" />
        <div className="p-6 rounded-3xl bg-surface/40 border border-border-soft col-span-1 md:col-span-2 h-32" />
      </div>

      {/* Members List Skeleton */}
      <div className="rounded-3xl border border-border-soft bg-surface/20 overflow-hidden">
        <div className="p-6 border-b border-border-soft bg-surface/40">
           <div className="h-6 w-48 bg-surface-dim rounded-lg" />
        </div>
        <div className="divide-y divide-border-soft">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-dim" />
                <div className="space-y-2">
                  <div className="h-5 w-40 bg-surface-dim rounded-lg" />
                  <div className="h-3 w-32 bg-surface-dim/50 rounded-lg" />
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-surface-dim" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
