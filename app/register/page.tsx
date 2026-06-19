import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Create Account",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

interface RegisterPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

import RegisterFormClient from "@/components/auth/RegisterFormClient";

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const [session, params] = await Promise.all([getSession(), searchParams]);

  if (session) {
    redirect(session.role === "ADMIN" ? "/admin" : "/account");
  }

  return (
    <div className="grain-overlay min-h-[calc(100vh-160px)] px-4 py-12 md:px-8">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[32px] border border-smoke bg-obsidian/90 shadow-[0_28px_70px_rgba(0,0,0,0.28)] lg:grid-cols-[0.95fr_1.05fr]">
        <section className="border-b border-smoke bg-[radial-gradient(circle_at_top_left,rgba(201,151,58,0.14),transparent_35%),linear-gradient(180deg,rgba(19,16,14,0.94),rgba(10,9,8,0.98))] p-8 md:p-10 lg:border-b-0 lg:border-r">
          <p className="font-ui text-xs tracking-[0.18em] text-gold">CREATE ACCOUNT</p>
          <h1 className="mt-4 max-w-lg text-safe font-title text-5xl text-ivory md:text-6xl">
            Start your reader account.
          </h1>
          <p className="mt-5 max-w-xl font-body text-lg leading-relaxed text-parchment/86">
            Use the same email you checkout with and your account can become the home for orders, profile updates, and future reader features.
          </p>

          <div className="mt-10 rounded-2xl border border-smoke bg-white/5 p-5">
            <p className="font-ui text-[11px] tracking-[0.16em] text-gold">WHY NOW</p>
            <p className="mt-3 font-body text-base text-parchment/80">
              This gives the storefront a proper customer identity layer while keeping admin access role-controlled behind the same auth system.
            </p>
          </div>
        </section>

        <section className="bg-obsidian/80 p-8 md:p-10">
          <div className="mx-auto max-w-md">
            <p className="font-ui text-xs tracking-[0.16em] text-gold">REGISTER</p>
            <h2 className="mt-3 text-safe font-title text-4xl text-ivory">Create your login.</h2>
            <p className="mt-3 font-body text-base text-stone">
              Customer accounts are standard by default. Admin access is added only by role.
            </p>

            <div className="mt-6">
              <RegisterFormClient initialError={params.error} />
            </div>


            <p className="mt-5 font-body text-sm text-stone">
              Already have an account?{" "}
              <Link href="/login" className="fx-link text-gold hover:text-gold-dim">
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
