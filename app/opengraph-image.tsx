import { ImageResponse } from "next/og";

export const alt = "Kothakhahon Prokashoni";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background:
            "radial-gradient(circle at top left, rgba(216,168,75,0.28), transparent 30%), linear-gradient(135deg, #16120e 0%, #241d16 52%, #110f0d 100%)",
          color: "#faf6ef",
          padding: "70px",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(90deg, rgba(250,246,239,0.03) 0, rgba(250,246,239,0.03) 1px, transparent 1px, transparent 86px)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            border: "1px solid rgba(216,168,75,0.24)",
            borderRadius: "32px",
            padding: "48px",
            background: "rgba(17, 15, 13, 0.82)",
            boxShadow: "0 24px 48px rgba(0,0,0,0.24)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div
              style={{
                fontSize: 22,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "#d8a84b",
              }}
            >
              Independent Bengali Publisher
            </div>
            <div style={{ fontSize: 76, lineHeight: 1.04, maxWidth: 780 }}>
              Kothakhahon Prokashoni
            </div>
            <div style={{ fontSize: 30, lineHeight: 1.35, color: "#e2d7c3", maxWidth: 860 }}>
              Literary fiction, essays, poetry, and enduring contemporary voices shaped with
              editorial depth.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#e2d7c3",
              fontSize: 24,
            }}
          >
            <div style={{ letterSpacing: "0.18em", textTransform: "uppercase", color: "#d8a84b" }}>
              Catalog / Journal / Direct Orders
            </div>
            <div>kothakhahon.com</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
