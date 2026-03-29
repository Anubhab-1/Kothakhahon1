"use client";

import { useFormStatus } from "react-dom";

export default function AdminSubmitButton({
  idleLabel,
  pendingLabel,
  className = "",
}: {
  idleLabel: string;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={`admin-button ${className}`.trim()}>
      {pending ? pendingLabel ?? "Saving..." : idleLabel}
    </button>
  );
}
