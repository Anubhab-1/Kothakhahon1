import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InfoPageShellProps {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
  aside?: ReactNode;
}

export default function InfoPageShell({
  eyebrow,
  title,
  intro,
  children,
  aside,
}: InfoPageShellProps) {
  return (
    <div className="grain-overlay mx-auto w-full max-w-7xl px-4 py-14 md:px-8 md:py-18">
      <section className="editorial-panel rounded-[30px] p-6 md:p-8">
        <p className="font-ui text-xs tracking-[0.18em] text-gold">{eyebrow}</p>
        <h1 className="mt-3 text-safe font-title text-5xl text-ivory md:text-6xl">{title}</h1>
        <p className="mt-4 max-w-4xl font-body text-lg text-stone">{intro}</p>
      </section>

      <div className={cn("mt-8 grid gap-6", aside && "lg:grid-cols-[1.08fr_0.92fr]")}>
        <div className="space-y-5">{children}</div>
        {aside ? <aside className="space-y-5">{aside}</aside> : null}
      </div>
    </div>
  );
}
