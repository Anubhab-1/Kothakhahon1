import { getLaunchReadiness } from "@/lib/env";

const toneClasses = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  blocked: "border-rose-200 bg-rose-50 text-rose-950",
} as const;

export default function LaunchReadiness() {
  const items = getLaunchReadiness();

  return (
    <section className="admin-card space-y-5">
      <div className="space-y-2">
        <p className="admin-eyebrow">Launch Readiness</p>
        <h2 className="font-title text-4xl text-ink">Production blockers are visible here.</h2>
        <p className="max-w-3xl font-body text-lg text-ink/70">
          This panel tracks environment and infra gaps that still separate the current build from a real domain launch.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <article
            key={item.key}
            className={`rounded-[22px] border px-5 py-4 shadow-[0_10px_24px_rgba(54,44,32,0.05)] ${toneClasses[item.status]}`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-title text-2xl">{item.label}</p>
              <span className="font-ui text-[11px] tracking-[0.15em] uppercase">{item.status}</span>
            </div>
            <p className="mt-3 font-body text-base leading-relaxed">{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
