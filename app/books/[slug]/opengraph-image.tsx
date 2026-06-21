import { ImageResponse } from "next/og";
import { getBookBySlug } from "@/lib/content";

export const runtime = "nodejs";

export const alt = "Kothakhahon Prokashoni - Book Preview";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

interface OpenGraphParams {
  params: Promise<{
    slug: string;
  }>;
}

export default async function OgImage({ params }: OpenGraphParams) {
  const resolvedParams = await params;
  const book = await getBookBySlug(resolvedParams.slug);

  if (!book) {
    return new ImageResponse(
      (
        <div
          style={{
            background: "#161412",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#e8e5de",
          }}
        >
          <div style={{ fontSize: 48, color: "#c9973a", marginBottom: 12 }}>Kothakhahon</div>
          <div style={{ fontSize: 24, opacity: 0.8 }}>Independent Bengali Publishing House</div>
        </div>
      ),
      {
        ...size,
      }
    );
  }

  const title = book.title || "Book Title";
  const authorName = book.author?.name || "Unknown Author";
  const price = book.price ? `₹${book.price}` : "";
  const genre = book.genre?.[0]?.name || "Bengali Literature";

  return new ImageResponse(
    (
      <div
        style={{
          background: "#161412",
          backgroundImage: "radial-gradient(circle at 50% 50%, #2e2820 0%, #161412 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "60px 80px",
          color: "#e8e5de",
          border: "12px solid #2e2820",
        }}
      >
        {/* Left side: book metadata */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            maxWidth: "60%",
            height: "100%",
          }}
        >
          <div
            style={{
              fontSize: 16,
              color: "#c9973a",
              textTransform: "uppercase",
              letterSpacing: "3px",
              marginBottom: "20px",
            }}
          >
            {genre}
          </div>
          <div
            style={{
              fontSize: 54,
              fontWeight: "bold",
              lineHeight: 1.2,
              marginBottom: "16px",
              color: "#ffffff",
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#e8e5de",
              opacity: 0.9,
              marginBottom: "32px",
            }}
          >
            by {authorName}
          </div>
          {price && (
            <div
              style={{
                fontSize: 24,
                color: "#c9973a",
                padding: "8px 20px",
                border: "1px solid #c9973a",
                borderRadius: "24px",
                width: "fit-content",
                display: "flex",
              }}
            >
              {price}
            </div>
          )}
        </div>

        {/* Right side: visual cover placeholder */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "280px",
            height: "400px",
            background: "#221d17",
            border: "2px solid #c9973a",
            boxShadow: "0 20px 45px rgba(0,0,0,0.6)",
            borderRadius: "8px",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#c9973a",
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginBottom: "auto",
              display: "flex",
            }}
          >
            KOTHAKHAHON
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: "#ffffff",
              marginBottom: "12px",
              marginTop: "auto",
              display: "flex",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 16,
              color: "#e8e5de",
              opacity: 0.8,
              marginTop: "4px",
              marginBottom: "auto",
              display: "flex",
            }}
          >
            {authorName}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "#c9973a",
              letterSpacing: "1px",
              marginTop: "auto",
              display: "flex",
            }}
          >
            DIRECT EDITION
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
