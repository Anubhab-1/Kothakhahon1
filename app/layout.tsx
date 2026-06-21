import type { Metadata } from "next";
import {
  Cinzel,
  Cormorant_Garamond,
  DM_Mono,
  EB_Garamond,
  Noto_Serif_Bengali,
} from "next/font/google";
import "./globals.css";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import PageTransition from "@/components/ui/PageTransition";
import ScrollToTop from "@/components/ui/ScrollToTop";
import CartDrawer from "@/components/ui/CartDrawer";
import { CartProvider } from "@/components/providers/CartProvider";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { PublicSessionProvider } from "@/components/auth/PublicSessionProvider";
import ToastProvider from "@/components/providers/ToastProvider";
import ConditionalPublicChrome from "@/components/layout/ConditionalPublicChrome";
import { getSiteUrl } from "@/lib/env";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const notoSerifBengali = Noto_Serif_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Kothakhahon Prokashoni",
    template: "%s | Kothakhahon Prokashoni",
  },
  description:
    "Kothakhahon Prokashoni is an independent Bengali publishing house for literary fiction, essays, and enduring contemporary voices.",
  metadataBase: getSiteUrl(),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Kothakhahon Prokashoni",
    description:
      "Literary publishing with editorial depth, timeless design, and modern Bengali storytelling.",
    type: "website",
    url: "/",
    siteName: "Kothakhahon Prokashoni",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Kothakhahon Prokashoni",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kothakhahon Prokashoni",
    description:
      "Literary publishing with editorial depth, timeless design, and modern Bengali storytelling.",
    images: ["/twitter-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${cormorant.variable} ${cinzel.variable} ${ebGaramond.variable} ${dmMono.variable} ${notoSerifBengali.variable} bg-void font-body text-parchment antialiased`}
        suppressHydrationWarning
      >
        <PublicSessionProvider>
          <CartProvider>
            <div className="relative min-h-screen overflow-x-clip">
              <LenisProvider>
                <ConditionalPublicChrome>
                  <NavBar />
                </ConditionalPublicChrome>
                <main>
                  <PageTransition>{children}</PageTransition>
                </main>
                <ConditionalPublicChrome>
                  <Footer />
                  <ScrollToTop />
                  <CartDrawer />
                </ConditionalPublicChrome>
                <ToastProvider />
              </LenisProvider>
            </div>
          </CartProvider>
        </PublicSessionProvider>
      </body>
    </html>
  );
}
