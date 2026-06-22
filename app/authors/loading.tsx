import { Skeleton } from "@/components/ui/skeletons";

export default function AuthorsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8 space-y-8 animate-pulse">
      {/* Header section */}
      <div>
        <Skeleton className="h-4 w-20 bg-ash/30 rounded" />
        <Skeleton className="mt-4 h-12 w-2/3 bg-ash/40 rounded-lg md:h-16" />
        <Skeleton className="mt-4 h-6 w-3/4 bg-ash/30 rounded-md" />
      </div>

      {/* Grid of author cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-10">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-smoke bg-obsidian/85 p-5 space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start gap-4">
                {/* Circular avatar placeholder */}
                <Skeleton className="h-16 w-16 shrink-0 rounded-full bg-ash/40" />
                <div className="min-w-0 flex-1 space-y-2">
                  {/* Name line */}
                  <Skeleton className="h-6 w-3/4 bg-ash/40 rounded" />
                  {/* Book count line */}
                  <Skeleton className="h-4 w-1/3 bg-ash/30 rounded-full" />
                </div>
              </div>
              {/* Genre tags/description line */}
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-full bg-ash/30 rounded" />
                <Skeleton className="h-4 w-5/6 bg-ash/30 rounded" />
              </div>
            </div>
            {/* Bottom link placeholder */}
            <Skeleton className="mt-4 h-4 w-24 bg-gold/20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
