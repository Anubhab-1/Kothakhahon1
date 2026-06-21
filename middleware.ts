import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "kothakhahon_session";

export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const isProd = process.env.NODE_ENV === "production";
  const { pathname } = request.nextUrl;

  // ── Admin route edge-level guard ─────────────────────────────────────────
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminLoginPage = pathname === "/admin/login";

  if (isAdminRoute && !isAdminLoginPage) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionCookie) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── CSP ──────────────────────────────────────────────────────────────────
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL ?? "";
  const cspHeader = [
    "default-src 'self';",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com;",
    "style-src 'self' 'unsafe-inline';",
    "img-src 'self' https://res.cloudinary.com data:;",
    "frame-src https://checkout.razorpay.com;",
    `connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com ${redisUrl};`,
    "font-src 'self';",
    "base-uri 'self';",
    "form-action 'self';"
  ].join(" ");

  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });

  // Security headers
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self)"
  );
  response.headers.set("x-nonce", nonce);
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.delete("X-Powered-By");

  // No caching for admin and API routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    response.headers.set("Cache-Control", "no-store, max-age=0");
  }

  if (isProd) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
