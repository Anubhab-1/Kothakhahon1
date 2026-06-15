"use client";

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
    <article
      style={{
        position: "relative",
        borderRadius: "20px",
        border: "1px solid rgba(99,102,241,0.14)",
        background: "linear-gradient(135deg, #181c27 0%, #1e2233 100%)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        padding: "1.5rem 1.75rem",
        overflow: "hidden",
        transition: "border-color 220ms ease, box-shadow 240ms ease, transform 220ms ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "rgba(99,102,241,0.32)";
        el.style.boxShadow = "0 16px 40px rgba(0,0,0,0.6), 0 0 32px rgba(99,102,241,0.15)";
        el.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "rgba(99,102,241,0.14)";
        el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.5)";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Glow blob */}
      <div
        style={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: "rgba(99,102,241,0.08)",
          filter: "blur(30px)",
          pointerEvents: "none",
        }}
      />

      <p
        style={{
          fontSize: "0.62rem",
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {label}
      </p>
      <p
        style={{
          marginTop: "0.75rem",
          fontSize: "3rem",
          fontWeight: 800,
          color: "#f0f2ff",
          lineHeight: 1,
          letterSpacing: "-0.03em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </p>
      <p
        style={{
          marginTop: "0.65rem",
          fontSize: "0.8rem",
          color: "#64748b",
          lineHeight: 1.5,
        }}
      >
        {hint}
      </p>
    </article>
  );
}
