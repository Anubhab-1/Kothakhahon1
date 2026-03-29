export default function AdminNotice({
  notice,
  error,
}: {
  notice?: string;
  error?: string;
}) {
  if (!notice && !error) {
    return null;
  }

  return (
    <div
      className={`rounded-[22px] border px-5 py-4 shadow-[0_16px_30px_rgba(54,44,32,0.06)] ${
        error
          ? "border-rose-200 bg-rose-50 text-rose-900"
          : "border-emerald-200 bg-emerald-50 text-emerald-900"
      }`}
    >
      <p className="font-ui text-[11px] tracking-[0.16em]">
        {error ? "ACTION BLOCKED" : "UPDATED"}
      </p>
      <p className="mt-1 font-body text-base leading-relaxed">{error ?? notice}</p>
    </div>
  );
}
