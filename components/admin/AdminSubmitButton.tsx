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
    <button
      type="submit"
      disabled={pending}
      className={`admin-button ${className}`.trim()}
      style={{
        position: "relative",
        minWidth: "160px",
      }}
    >
      {pending && (
        <span
          style={{
            display: "inline-block",
            width: 14,
            height: 14,
            border: "2px solid rgba(255,255,255,0.3)",
            borderTopColor: "#fff",
            borderRadius: "50%",
            animation: "adm-spin 0.7s linear infinite",
            flexShrink: 0,
          }}
        />
      )}
      {pending ? (pendingLabel ?? "Saving...") : idleLabel}
    </button>
  );
}
