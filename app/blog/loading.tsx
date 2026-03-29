export default function BlogLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8">
      <div className="h-4 w-28 animate-pulse rounded bg-smoke" />
      <div className="mt-4 h-14 w-96 animate-pulse rounded bg-ash" />
      <div className="mt-3 h-5 w-full max-w-2xl animate-pulse rounded bg-smoke" />

      <div className="mt-8 h-12 w-full animate-pulse rounded bg-ash" />

      <div className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="min-h-[320px] animate-pulse rounded-2xl bg-ash" />
        <div className="space-y-3 rounded-2xl border border-smoke bg-obsidian p-7">
          <div className="h-3 w-24 animate-pulse rounded bg-smoke" />
          <div className="h-10 w-5/6 animate-pulse rounded bg-ash" />
          <div className="h-5 w-full animate-pulse rounded bg-smoke" />
        </div>
      </div>
    </div>
  );
}
