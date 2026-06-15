import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole, ArrowLeft } from "lucide-react";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";
import { resetPasswordAction } from "@/app/auth/actions";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string; error?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = params.token ?? "";

  // Validate token server-side before showing the form
  const isValidToken = token
    ? !!(await db.passwordResetToken.findUnique({
        where: { token },
        select: { id: true, usedAt: true, expiresAt: true },
      }).then((t) => t && !t.usedAt && t.expiresAt > new Date()))
    : false;

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
          <p className="font-ui text-[11px] tracking-[0.22em] text-gold">ACCOUNT SECURITY</p>
          <h1 className="text-safe font-title text-4xl text-ivory sm:text-5xl">
            Set a new password
          </h1>
        </div>

        {params.error && (
          <div className="mt-6 rounded-[1.35rem] border border-ember/40 bg-ember/10 px-4 py-3 font-body text-sm text-ember">
            {params.error}
          </div>
        )}

        {!isValidToken ? (
          <div className="mt-6 rounded-[1.35rem] border border-smoke/60 bg-white/3 p-6">
            <p className="font-body text-base text-stone">
              This reset link is invalid, has already been used, or has expired.
            </p>
            <Link
              href="/forgot-password"
              className="fx-button mt-5 inline-flex rounded-full border border-gold bg-gold px-5 py-3 font-ui text-xs tracking-[0.14em] text-void transition hover:bg-gold-dim"
            >
              REQUEST NEW LINK
            </Link>
          </div>
        ) : (
          <form
            action={resetPasswordAction}
            className="mt-6 space-y-5 rounded-[1.5rem] border border-smoke/60 bg-white/3 p-6 backdrop-blur"
          >
            <input type="hidden" name="token" value={token} />

            <label className="block space-y-2">
              <span className="font-ui text-[11px] tracking-[0.18em] text-parchment/76">
                NEW PASSWORD
              </span>
              <span className="relative flex items-center">
                <LockKeyhole className="pointer-events-none absolute left-3 h-4 w-4 text-stone" />
                <input
                  type="password"
                  name="newPassword"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-smoke bg-void py-2.5 pl-9 pr-3 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
                  placeholder="At least 8 characters"
                  suppressHydrationWarning
                />
              </span>
            </label>

            <label className="block space-y-2">
              <span className="font-ui text-[11px] tracking-[0.18em] text-parchment/76">
                CONFIRM PASSWORD
              </span>
              <span className="relative flex items-center">
                <LockKeyhole className="pointer-events-none absolute left-3 h-4 w-4 text-stone" />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-smoke bg-void py-2.5 pl-9 pr-3 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
                  placeholder="Repeat your new password"
                  suppressHydrationWarning
                />
              </span>
            </label>

            <AuthSubmitButton
              idleLabel="UPDATE PASSWORD"
              pendingLabel="UPDATING..."
              className="w-full !py-3.5"
            />
          </form>
        )}
      </div>
    </div>
  );
}
