"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import AuthSubmitButton from "./AuthSubmitButton";
import { loginAction, resendVerificationAction } from "@/app/auth/actions";
import { Eye, EyeOff, ShieldAlert, Mail, LockKeyhole, ShieldCheck } from "lucide-react";
import styles from "@/app/login/login.module.css";
import Turnstile from "@/components/ui/Turnstile";

interface LoginFormClientProps {
  nextPath: string;
  initialError?: string;
  unverified?: boolean;
  email?: string;
}

export default function LoginFormClient({
  nextPath,
  initialError,
  unverified,
  email: initialEmail,
}: LoginFormClientProps) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [clientError, setClientError] = useState("");
  const [shake, setShake] = useState(!!initialError);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setClientError("");
    setShake(false);

    if (!email || !password) {
      e.preventDefault();
      setClientError("Email and password are required.");
      setShake(true);
      return;
    }

    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken) {
      e.preventDefault();
      setClientError("Please complete the CAPTCHA.");
      setShake(true);
      return;
    }
  };

  return (
    <div className="space-y-5">
      {(clientError || initialError) && (
        <div 
          className={cn(
            "rounded-[1.35rem] border border-ember/40 bg-ember/10 px-4 py-3 font-body text-sm text-ember/90 backdrop-blur-md flex items-center gap-2",
            shake && "animate-shake"
          )}
          onAnimationEnd={() => setShake(false)}
        >
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{clientError || initialError}</span>
        </div>
      )}

      {unverified && email && (
        <form
          action={resendVerificationAction}
          className="rounded-[1.35rem] border border-gold/30 bg-gold/5 p-5 text-sm space-y-3 backdrop-blur-md transition-all duration-300"
        >
          <p className="font-body text-parchment/80 leading-relaxed">
            Need us to resend the verification link? Click below to send a new activation link to <strong>{email}</strong>.
          </p>
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="next" value={nextPath} />
          <AuthSubmitButton
            idleLabel="RESEND VERIFICATION LINK"
            pendingLabel="SENDING..."
            className="w-full !py-2.5 !text-xs !bg-gold/20 hover:!bg-gold/35 !text-gold border border-gold/40 shadow-sm"
          />
        </form>
      )}

      <form 
        action={loginAction} 
        onSubmit={handleFormSubmit}
        className={cn(
          styles.formCard, 
          "mt-6 space-y-5 p-5 sm:p-6 transition-all duration-300",
          shake && "animate-shake"
        )}
      >
        <input type="hidden" name="next" value={nextPath} />

        <label className="block space-y-2">
          <span className="font-ui text-[11px] tracking-[0.18em] text-parchment/76">EMAIL</span>
          <span className={styles.inputShell}>
            <Mail aria-hidden className={cn(styles.inputIcon, "h-4 w-4")} />
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.inputField}
              placeholder="you@example.com"
              suppressHydrationWarning
            />
          </span>
        </label>

        <label className="block space-y-2">
          <span className="font-ui text-[11px] tracking-[0.18em] text-parchment/76">PASSWORD</span>
          <span className={cn(styles.inputShell, "relative pr-10")}>
            <LockKeyhole aria-hidden className={cn(styles.inputIcon, "h-4 w-4")} />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(styles.inputField, "w-full")}
              placeholder="Enter your password"
              suppressHydrationWarning
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-gold transition p-1"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </label>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="font-ui text-[11px] tracking-[0.14em] text-stone transition hover:text-gold"
          >
            FORGOT PASSWORD?
          </Link>
        </div>

        <div className="flex items-start gap-3 rounded-[1.2rem] border border-smoke/80 bg-white/4 px-4 py-3 text-sm text-stone backdrop-blur">
          <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <p className="font-body leading-relaxed">Your account opens the right area automatically based on role.</p>
        </div>

        <Turnstile onChange={setCaptchaToken} />
        <input type="hidden" name="cf-turnstile-response" value={captchaToken} />

        <AuthSubmitButton
          idleLabel="SIGN IN"
          pendingLabel="SIGNING IN..."
          className="w-full !py-3.5 shadow-[0_20px_36px_rgba(216,168,75,0.22)]"
        />
      </form>
    </div>
  );
}
