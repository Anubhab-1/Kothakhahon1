import type { ReactNode } from "react";

export default function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-ink/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        <p className="admin-eyebrow">{eyebrow}</p>
        <h1 className="font-title text-4xl text-ink md:text-5xl">{title}</h1>
        {description ? <p className="max-w-3xl font-body text-lg text-ink/70">{description}</p> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
