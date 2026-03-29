export default function AdminStatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="admin-card">
      <p className="admin-eyebrow">{label}</p>
      <p className="mt-4 font-title text-5xl text-ink">{value}</p>
      <p className="mt-3 font-body text-base text-ink/68">{hint}</p>
    </article>
  );
}
