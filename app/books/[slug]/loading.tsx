export default function BookDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="mx-auto aspect-[3/4] w-full max-w-[340px] animate-pulse rounded-2xl bg-ash" />
        <div className="space-y-4">
          <div className="h-6 w-32 animate-pulse rounded bg-smoke" />
          <div className="h-14 w-2/3 animate-pulse rounded bg-ash" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-smoke" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`meta-${index}`} className="h-24 animate-pulse rounded-lg bg-ash" />
            ))}
          </div>
          <div className="h-36 animate-pulse rounded-xl bg-ash" />
        </div>
      </div>
    </div>
  );
}
