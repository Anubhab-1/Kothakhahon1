import { getLaunchReadiness } from "@/lib/env";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const toneConfig = {
  ready: {
    border: "rgba(16,185,129,0.2)",
    background: "rgba(16,185,129,0.07)",
    iconColor: "#10b981",
    labelColor: "#6ee7b7",
    badgeBg: "rgba(16,185,129,0.12)",
    badgeBorder: "rgba(16,185,129,0.25)",
    badgeColor: "#10b981",
    icon: CheckCircle2,
  },
  warning: {
    border: "rgba(245,158,11,0.2)",
    background: "rgba(245,158,11,0.07)",
    iconColor: "#f59e0b",
    labelColor: "#fcd34d",
    badgeBg: "rgba(245,158,11,0.12)",
    badgeBorder: "rgba(245,158,11,0.25)",
    badgeColor: "#f59e0b",
    icon: AlertTriangle,
  },
  blocked: {
    border: "rgba(244,63,94,0.2)",
    background: "rgba(244,63,94,0.07)",
    iconColor: "#f43f5e",
    labelColor: "#fda4af",
    badgeBg: "rgba(244,63,94,0.12)",
    badgeBorder: "rgba(244,63,94,0.25)",
    badgeColor: "#f43f5e",
    icon: XCircle,
  },
} as const;

export default function LaunchReadiness() {
  const items = getLaunchReadiness();

  return (
    <section className="admin-card" style={{ gap: 0 }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <p
          style={{
            display: "inline-block",
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "0.4rem",
          }}
        >
          Launch Readiness
        </p>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#f0f2ff",
            letterSpacing: "-0.02em",
          }}
        >
          Production blockers are visible here.
        </h2>
        <p style={{ marginTop: "0.35rem", fontSize: "0.825rem", color: "#64748b" }}>
          Environment and infra gaps that separate this build from a live domain launch.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: "0.75rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        }}
      >
        {items.map((item) => {
          const cfg = toneConfig[item.status];
          const Icon = cfg.icon;

          return (
            <article
              key={item.key}
              style={{
                borderRadius: "14px",
                border: `1px solid ${cfg.border}`,
                background: cfg.background,
                padding: "1rem 1.15rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  marginBottom: "0.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Icon
                    style={{ width: 15, height: 15, color: cfg.iconColor, flexShrink: 0 }}
                  />
                  <p
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: cfg.labelColor,
                    }}
                  >
                    {item.label}
                  </p>
                </div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "0.15rem 0.55rem",
                    borderRadius: "999px",
                    background: cfg.badgeBg,
                    border: `1px solid ${cfg.badgeBorder}`,
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: cfg.badgeColor,
                    flexShrink: 0,
                  }}
                >
                  {item.status}
                </span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.5 }}>
                {item.detail}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
