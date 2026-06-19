import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";
import { resendVerificationAction } from "@/app/auth/actions";

export const metadata: Metadata = {
  title: "Verify Your Email",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

interface VerifyPendingPageProps {
  searchParams: Promise<{
    email?: string;
    notice?: string;
    error?: string;
  }>;
}

export default async function VerifyPendingPage({ searchParams }: VerifyPendingPageProps) {
  const params = await searchParams;
  const email = params.email ? decodeURIComponent(params.email) : "";

  return (
    <div className="grain-overlay relative min-h-[calc(100vh-160px)] px-4 py-12 md:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(216,168,75,0.14),transparent_68%)]" />

      <div className="mx-auto max-w-xl overflow-hidden rounded-[32px] border border-smoke bg-obsidian/90 shadow-[0_28px_70px_rgba(0,0,0,0.28)] p-8 md:p-10 text-center space-y-8">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 font-ui text-[10px] tracking-[0.24em] text-gold backdrop-blur">
          <Sparkles aria-hidden className="h-3.5 w-3.5" />
          VERIFICATION SENT
        </div>

        <div className="space-y-4">
          <h1 className="text-safe font-title text-4xl text-ivory md:text-5xl">
            Check your inbox.
          </h1>
          <p className="max-w-lg mx-auto font-body text-base leading-relaxed text-parchment/78">
            We&apos;ve sent a verification link to {email ? <strong className="text-ivory">{email}</strong> : "your email address"}. Please click the link inside the email to activate your account.
          </p>
        </div>

        {params.notice && (
          <div className="rounded-2xl border border-gold/35 bg-gold/10 px-4 py-3 font-body text-sm text-gold backdrop-blur max-w-md mx-auto flex items-center gap-2 justify-center">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{params.notice}</span>
          </div>
        )}

        {params.error && (
          <div className="rounded-2xl border border-ember/45 bg-ember/10 px-4 py-3 font-body text-sm text-ember/90 backdrop-blur max-w-md mx-auto flex items-center gap-2 justify-center">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{params.error}</span>
          </div>
        )}

        <div className="border-t border-smoke/70 pt-8 max-w-md mx-auto space-y-6">
          <p className="font-body text-sm text-stone leading-relaxed">
            Didn&apos;t receive the email? Check your spam folder or click below to send another link.
          </p>

          {email && (
            <form action={resendVerificationAction} className="space-y-3">
              <input type="hidden" name="email" value={email} />
              <AuthSubmitButton
                idleLabel="RESEND VERIFICATION EMAIL"
                pendingLabel="SENDING..."
                className="w-full !py-3.5 shadow-[0_20px_36px_rgba(216,168,75,0.18)]"
              />
            </form>
          )}

          <p className="font-body text-sm text-stone">
            Back to{" "}
            <Link href="/login" className="fx-link text-gold hover:text-gold-dim">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
