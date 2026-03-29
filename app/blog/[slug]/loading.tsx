export default function BlogPostLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-14 md:px-8">
      <div className="h-3 w-20 animate-pulse rounded bg-smoke" />
      <div className="mt-4 h-14 w-5/6 animate-pulse rounded bg-ash" />
      <div className="mt-4 h-5 w-full animate-pulse rounded bg-smoke" />
      <div className="mt-8 aspect-[16/9] animate-pulse rounded-2xl bg-ash" />
      <div className="mt-10 space-y-4 rounded-2xl border border-smoke bg-obsidian p-8">
        <div className="h-5 w-full animate-pulse rounded bg-smoke" />
        <div className="h-5 w-11/12 animate-pulse rounded bg-smoke" />
        <div className="h-5 w-10/12 animate-pulse rounded bg-smoke" />
        <div className="h-5 w-full animate-pulse rounded bg-smoke" />
      </div>
    </div>
  );
}
