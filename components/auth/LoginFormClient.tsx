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

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-smoke/30"></div>
          <span className="flex-shrink mx-4 text-[10px] tracking-[0.18em] text-stone font-ui">OR</span>
          <div className="flex-grow border-t border-smoke/30"></div>
        </div>

        <a
          href="/api/auth/google"
          className="w-full py-3.5 px-4 rounded-[1.35rem] border border-smoke/60 bg-white/5 font-ui text-[11px] tracking-[0.18em] text-parchment hover:bg-white/10 flex items-center justify-center gap-3 transition-all duration-300 shadow-sm"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          CONTINUE WITH GOOGLE
        </a>
      </form>
    </div>
  );
}
