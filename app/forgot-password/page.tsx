import type { Metadata } from "next";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";
import { forgotPasswordAction } from "@/app/auth/actions";

export const metadata: Metadata = {
  title: "Forgot Password",
  robots: { index: false, follow: false },
};

interface ForgotPasswordPageProps {
  searchParams: Promise<{ error?: string; notice?: string }>;
}

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <div className="grain-overlay relative min-h-[calc(100vh-160px)] px-4 py-10 md:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(216,168,75,0.14),transparent_68%)]" />

      <div className="relative mx-auto max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 font-ui text-[11px] tracking-[0.16em] text-stone transition hover:text-gold"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          BACK TO LOGIN
        </Link>

        <div className="mt-8 space-y-3">
          <p className="font-ui text-[11px] tracking-[0.22em] text-gold">ACCOUNT RECOVERY</p>
          <h1 className="text-safe font-title text-4xl text-ivory sm:text-5xl">
            Forgot your password?
          </h1>
          <p className="font-body text-base text-stone">
            Enter the email address on your account and we will send a reset link. The link expires in 1 hour.
          </p>
        </div>

        {params.notice && (
          <div className="mt-6 rounded-[1.35rem] border border-gold/35 bg-gold/10 px-4 py-3 font-body text-sm text-gold">
            {params.notice}
          </div>
        )}

        {params.error && (
          <div className="mt-6 rounded-[1.35rem] border border-ember/40 bg-ember/10 px-4 py-3 font-body text-sm text-ember">
            {params.error}
          </div>
        )}

        {!params.notice && (
          <form action={forgotPasswordAction} className="mt-6 space-y-5 rounded-[1.5rem] border border-smoke/60 bg-white/3 p-6 backdrop-blur">
            <label className="block space-y-2">
              <span className="font-ui text-[11px] tracking-[0.18em] text-parchment/76">EMAIL</span>
              <span className="relative flex items-center">
                <Mail className="pointer-events-none absolute left-3 h-4 w-4 text-stone" />
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-smoke bg-void py-2.5 pl-9 pr-3 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
                  placeholder="you@example.com"
                  suppressHydrationWarning
                />
              </span>
            </label>

            <AuthSubmitButton
              idleLabel="SEND RESET LINK"
              pendingLabel="SENDING..."
              className="w-full !py-3.5"
            />
          </form>
        )}

        <p className="mt-6 font-body text-sm text-stone">
          Remembered it?{" "}
          <Link href="/login" className="fx-link text-gold hover:text-gold-dim">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
