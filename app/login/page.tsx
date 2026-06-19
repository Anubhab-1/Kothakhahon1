import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpenText, ShieldCheck, Sparkles } from "lucide-react";
import LoginFormClient from "@/components/auth/LoginFormClient";
import { getSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import styles from "./login.module.css";

export const metadata: Metadata = {
  title: "Login",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

interface LoginPageProps {
  searchParams: Promise<{
    error?: string;
    notice?: string;
    next?: string;
    unverified?: string;
    email?: string;
  }>;
}

function getSafeNextPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "";
  }
  return value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [session, params] = await Promise.all([getSession(), searchParams]);
  const next = getSafeNextPath(params.next);

  if (session) {
    if (next) {
      if (next.startsWith("/admin") && session.role !== "ADMIN") {
        redirect("/account?notice=Admin%20access%20is%20restricted%20to%20staff%20accounts.");
      }
      redirect(next);
    }

    redirect(session.role === "ADMIN" ? "/admin" : "/account");
  }

  return (
    <div className="grain-overlay relative min-h-[calc(100vh-160px)] px-4 py-6 sm:py-10 md:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(216,168,75,0.18),transparent_68%)]" />

      <div className={cn(styles.stage, "mx-auto max-w-6xl md:grid md:grid-cols-[1.08fr_0.92fr]")}>
        <section
          className={cn(
            styles.hero,
            "hidden border-b border-smoke/70 p-6 sm:p-8 md:flex md:border-b-0 md:border-r md:p-10 lg:p-12",
          )}
        >
          <div className="relative z-10 flex h-full flex-col justify-between gap-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 font-ui text-[10px] tracking-[0.24em] text-gold backdrop-blur">
                <Sparkles aria-hidden className="h-3.5 w-3.5" />
                ACCOUNT ACCESS
              </div>

              <div className="max-w-xl space-y-4">
                <p className="font-ui text-[11px] tracking-[0.22em] text-parchment/62">LOGIN</p>
                <h1 className="text-safe font-title text-4xl text-ivory sm:text-5xl lg:text-6xl">
                  One door for readers and staff.
                </h1>
                <p className="max-w-lg font-body text-lg leading-relaxed text-parchment/78">
                  Clean sign-in, role-aware routing, and a quieter interface.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-smoke/80 bg-white/6 px-4 py-2 font-ui text-[10px] tracking-[0.18em] text-parchment/88 backdrop-blur">
                  <BookOpenText aria-hidden className="h-3.5 w-3.5 text-gold" />
                  Reader access
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-smoke/80 bg-white/6 px-4 py-2 font-ui text-[10px] tracking-[0.18em] text-parchment/88 backdrop-blur">
                  <ShieldCheck aria-hidden className="h-3.5 w-3.5 text-gold" />
                  Admin by role
                </span>
              </div>
            </div>

            <div className={styles.orbitPanel}>
              <div className={cn(styles.ring, styles.ringPrimary)} />
              <div className={cn(styles.ring, styles.ringSecondary)} />
              <div className={cn(styles.ring, styles.ringTertiary)} />

              <div className={styles.core}>
                <span className="font-ui text-[10px] tracking-[0.2em] text-gold">KOTHAKHAHON</span>
                <strong className="mt-2 block text-safe font-title text-3xl text-ivory sm:text-4xl">
                  Login
                </strong>
                <span className="mt-2 max-w-[11rem] font-body text-sm text-parchment/68">
                  Routing opens the right dashboard automatically.
                </span>
              </div>

              <div className={cn(styles.tag, styles.tagTop)}>
                <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
                Reader orders
              </div>
              <div className={cn(styles.tag, styles.tagRight)}>
                <span className="h-1.5 w-1.5 rounded-full bg-sage" aria-hidden />
                Staff workspace
              </div>
              <div className={cn(styles.tag, styles.tagBottom)}>
                <span className="h-1.5 w-1.5 rounded-full bg-parchment" aria-hidden />
                Profile access
              </div>

              <div className={cn(styles.dot, styles.dotOne)} />
              <div className={cn(styles.dot, styles.dotTwo)} />
              <div className={cn(styles.dot, styles.dotThree)} />
            </div>
          </div>
        </section>

        <section className="relative p-6 sm:p-8 md:p-10 lg:p-12">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]" />

          <div className="relative z-10 mx-auto flex max-w-md flex-col justify-center">
            <div className="space-y-3">
              <p className="font-ui text-[11px] tracking-[0.22em] text-gold">WELCOME BACK</p>
              <h2 className="text-safe font-title text-4xl text-ivory sm:text-[2.8rem]">Sign in.</h2>
              <p className="font-body text-base text-stone">Use your account email.</p>
            </div>

            {params.notice ? (
              <div className="mt-5 rounded-[1.35rem] border border-gold/35 bg-gold/10 px-4 py-3 font-body text-sm text-gold backdrop-blur">
                {params.notice}
              </div>
            ) : null}

            <LoginFormClient
              nextPath={next}
              initialError={params.error}
              unverified={params.unverified === "true"}
              email={params.email}
            />

            <p className="mt-6 font-body text-sm text-stone">
              New here?{" "}
              <Link href="/register" className="fx-link inline-flex items-center gap-1 text-gold hover:text-gold-dim">
                Create an account
                <ArrowRight aria-hidden className="h-3 w-3" />
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
