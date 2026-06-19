import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ShieldAlert, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { queueWelcomeEmail, runEmailJobsAfterResponse } from "@/lib/email-jobs";

export const metadata: Metadata = {
  title: "Email Verification",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

interface VerifyEmailPageProps {
  searchParams: Promise<{
    token?: string;
  }>;
}

async function claimOrdersForUser(userId: string, email: string) {
  await db.order.updateMany({
    where: {
      userId: null,
      customerEmail: email,
    },
    data: {
      userId,
    },
  });
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    return (
      <VerifyErrorCard message="Verification token is missing. Please check your verification link or request a new one." />
    );
  }

  // Find verification token
  const verificationToken = await db.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return (
      <VerifyErrorCard message="This verification link is invalid. Please make sure you copied it correctly." />
    );
  }

  if (verificationToken.usedAt) {
    return (
      <VerifySuccessCard
        message="This link has already been used to verify your email. You can proceed to sign in."
        showLoginBtn
      />
    );
  }

  if (verificationToken.expiresAt < new Date()) {
    return (
      <VerifyErrorCard
        message="This verification link has expired. Verification links are valid for 24 hours. Please request a new link."
        email={verificationToken.email}
      />
    );
  }

  // Find user
  const user = await db.user.findUnique({
    where: { email: verificationToken.email },
  });

  if (!user || !user.isActive) {
    return <VerifyErrorCard message="We could not find an active account associated with this verification link." />;
  }

  // Transactionally verify and log in
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    }),
    db.emailVerificationToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ]);

  // Sync background welcome email
  try {
    await queueWelcomeEmail(user.email, user.fullName ?? "Reader");
    runEmailJobsAfterResponse();
  } catch (error) {
    console.error("Failed to queue welcome email:", error);
  }

  // Auto login!
  await createSession(user);
  await claimOrdersForUser(user.id, user.email);

  // Redirect to account dashboard
  redirect("/account?notice=Your%20email%20has%20been%20verified%20successfully.%20Welcome%20to%20Kothakhahon!");
}

function VerifySuccessCard({ message, showLoginBtn }: { message: string; showLoginBtn?: boolean }) {
  return (
    <div className="grain-overlay relative min-h-[calc(100vh-160px)] px-4 py-12 md:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(216,168,75,0.14),transparent_68%)]" />

      <div className="mx-auto max-w-xl overflow-hidden rounded-[32px] border border-smoke bg-obsidian/90 shadow-[0_28px_70px_rgba(0,0,0,0.28)] p-8 md:p-10 text-center space-y-6">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 font-ui text-[10px] tracking-[0.24em] text-emerald-400 backdrop-blur">
          <CheckCircle2 aria-hidden className="h-3.5 w-3.5" />
          VERIFICATION SUCCESSFUL
        </div>

        <div className="space-y-4">
          <h1 className="text-safe font-title text-4xl text-ivory md:text-5xl">
            Email Verified!
          </h1>
          <p className="max-w-lg mx-auto font-body text-base leading-relaxed text-parchment/78">
            {message}
          </p>
        </div>

        {showLoginBtn && (
          <div className="pt-6 border-t border-smoke/70 max-w-md mx-auto">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-gold hover:bg-gold-dim px-4 py-3 font-ui text-sm font-semibold tracking-[0.08em] text-void transition shadow-[0_20px_36px_rgba(216,168,75,0.18)]"
            >
              LOG IN TO YOUR ACCOUNT
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function VerifyErrorCard({ message, email }: { message: string; email?: string }) {
  return (
    <div className="grain-overlay relative min-h-[calc(100vh-160px)] px-4 py-12 md:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.1),transparent_68%)]" />

      <div className="mx-auto max-w-xl overflow-hidden rounded-[32px] border border-smoke bg-obsidian/90 shadow-[0_28px_70px_rgba(0,0,0,0.28)] p-8 md:p-10 text-center space-y-6">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-ember/30 bg-ember/10 px-4 py-2 font-ui text-[10px] tracking-[0.24em] text-ember backdrop-blur">
          <ShieldAlert aria-hidden className="h-3.5 w-3.5" />
          VERIFICATION ERROR
        </div>

        <div className="space-y-4">
          <h1 className="text-safe font-title text-4xl text-ivory md:text-5xl">
            Invalid Link
          </h1>
          <p className="max-w-lg mx-auto font-body text-base leading-relaxed text-parchment/78">
            {message}
          </p>
        </div>

        <div className="pt-6 border-t border-smoke/70 max-w-md mx-auto space-y-4">
          {email && (
            <Link
              href={`/login?unverified=true&email=${encodeURIComponent(email)}`}
              className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-gold hover:bg-gold-dim px-4 py-3 font-ui text-sm font-semibold tracking-[0.08em] text-void transition shadow-[0_20px_36px_rgba(216,168,75,0.18)]"
            >
              RESEND VERIFICATION LINK
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}

          <p className="font-body text-sm text-stone">
            Go back to the{" "}
            <Link href="/login" className="fx-link text-gold hover:text-gold-dim font-semibold">
              Sign In
            </Link>{" "}
            page.
          </p>
        </div>
      </div>
    </div>
  );
}
