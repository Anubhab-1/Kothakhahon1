import { CheckCircle2, XCircle } from "lucide-react";

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

  const isError = Boolean(error);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.875rem",
        borderRadius: "16px",
        border: `1px solid ${isError ? "rgba(244,63,94,0.25)" : "rgba(16,185,129,0.25)"}`,
        background: isError
          ? "rgba(244,63,94,0.08)"
          : "rgba(16,185,129,0.08)",
        padding: "1rem 1.25rem",
        boxShadow: isError
          ? "0 4px 20px rgba(244,63,94,0.1)"
          : "0 4px 20px rgba(16,185,129,0.1)",
      }}
    >
      {isError ? (
        <XCircle
          style={{ width: 18, height: 18, color: "#f43f5e", flexShrink: 0, marginTop: 1 }}
        />
      ) : (
        <CheckCircle2
          style={{ width: 18, height: 18, color: "#10b981", flexShrink: 0, marginTop: 1 }}
        />
      )}
      <div>
        <p
          style={{
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: isError ? "#f43f5e" : "#10b981",
            marginBottom: "0.2rem",
          }}
        >
          {isError ? "Action Blocked" : "Updated"}
        </p>
        <p
          style={{
            fontSize: "0.875rem",
            color: isError ? "#fda4af" : "#6ee7b7",
            lineHeight: 1.5,
          }}
        >
          {error ?? notice}
        </p>
      </div>
    </div>
  );
}
