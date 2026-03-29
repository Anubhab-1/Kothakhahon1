export default function BooksLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-8 md:py-12">
      <section className="border-y border-smoke bg-void/95 py-4">
        <div className="h-11 w-full animate-pulse rounded bg-ash" />
        <div className="mt-4 flex gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`pill-${index}`} className="h-8 w-24 animate-pulse rounded-full bg-ash" />
          ))}
        </div>
      </section>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <article
            key={`skeleton-${index}`}
            className="rounded-xl border border-smoke bg-obsidian/80 p-3 sm:p-4"
          >
            <div className="aspect-[3/4] animate-pulse rounded-lg bg-ash" />
            <div className="mt-4 space-y-2">
              <div className="h-6 animate-pulse rounded bg-ash sm:h-7" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-smoke" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-smoke" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
