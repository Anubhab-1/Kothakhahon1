"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import AuthSubmitButton from "./AuthSubmitButton";
import { registerAction } from "@/app/auth/actions";
import { Eye, EyeOff, ShieldAlert, CheckCircle } from "lucide-react";
import Turnstile from "@/components/ui/Turnstile";

interface RegisterFormClientProps {
  initialError?: string;
}

export default function RegisterFormClient({ initialError }: RegisterFormClientProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [clientError, setClientError] = useState("");
  const [shake, setShake] = useState(!!initialError);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "Enter password", color: "bg-smoke text-stone" };
    if (pass.length < 8) return { score: 1, label: "Too Short", color: "bg-ember text-ember" };
    
    // Check complexity
    const hasLetters = /[a-zA-Z]/.test(pass);
    const hasNumbers = /[0-9]/.test(pass);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pass);
    
    const count = [hasLetters, hasNumbers, hasSpecial].filter(Boolean).length;
    
    if (count === 3 && pass.length >= 10) {
      return { score: 3, label: "Strong", color: "bg-emerald-500 text-emerald-400" };
    }
    if (count >= 2) {
      return { score: 2, label: "Medium", color: "bg-gold text-gold" };
    }
    return { score: 1, label: "Weak", color: "bg-ember text-ember" };
  };

  const strength = getPasswordStrength(password);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setClientError("");
    setShake(false);

    if (password.length < 8) {
      e.preventDefault();
      setClientError("Your password requires more weight. Please use at least 8 characters.");
      setShake(true);
      return;
    }

    if (password !== confirmPassword) {
      e.preventDefault();
      setClientError("Passwords do not match.");
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
            "rounded-2xl border border-ember/40 bg-ember/10 px-4 py-3 font-body text-sm text-ember/90 backdrop-blur-md flex items-center gap-2",
            shake && "animate-shake"
          )}
          onAnimationEnd={() => setShake(false)}
        >
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{clientError || initialError}</span>
        </div>
      )}

      <form 
        action={registerAction} 
        onSubmit={handleFormSubmit}
        className={cn(
          "mt-6 space-y-5 rounded-[28px] border border-smoke bg-void/80 p-6 transition-all duration-300",
          shake && "animate-shake"
        )}
      >
        <label className="block space-y-2">
          <span className="font-ui text-xs tracking-[0.14em] text-parchment">FULL NAME</span>
          <input
            type="text"
            name="fullName"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-smoke bg-obsidian px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
            placeholder="Your full name"
          />
        </label>

        <label className="block space-y-2">
          <span className="font-ui text-xs tracking-[0.14em] text-parchment">EMAIL</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-smoke bg-obsidian px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
            placeholder="you@example.com"
          />
        </label>

        <label className="block space-y-2">
          <span className="font-ui text-xs tracking-[0.14em] text-parchment">PASSWORD</span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-smoke bg-obsidian pl-3 pr-10 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-gold transition p-1"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          
          {/* Password strength visualizer */}
          {password && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-[10px] tracking-[0.1em] font-ui">
                <span className="text-stone">PASSWORD STRENGTH</span>
                <span className={strength.score === 3 ? "text-emerald-400 font-bold" : strength.score === 2 ? "text-gold font-bold" : "text-ember font-bold"}>
                  {strength.label.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 h-1.5 w-full bg-smoke/45 rounded-full overflow-hidden">
                <div className={cn("h-full transition-all duration-300", strength.score >= 1 ? strength.color.split(" ")[0] : "bg-transparent")} />
                <div className={cn("h-full transition-all duration-300", strength.score >= 2 ? strength.color.split(" ")[0] : "bg-transparent")} />
                <div className={cn("h-full transition-all duration-300", strength.score >= 3 ? strength.color.split(" ")[0] : "bg-transparent")} />
              </div>
            </div>
          )}
        </label>

        <label className="block space-y-2">
          <span className="font-ui text-xs tracking-[0.14em] text-parchment">CONFIRM PASSWORD</span>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-smoke bg-obsidian pl-3 pr-10 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
              placeholder="Repeat your password"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-gold transition p-1"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          
          {/* Match validation badge */}
          {confirmPassword && (
            <div className="pt-1 flex items-center gap-1 font-ui text-[10px] tracking-[0.1em]">
              {password === confirmPassword ? (
                <>
                  <CheckCircle className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">PASSWORDS MATCH</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-3 w-3 text-ember" />
                  <span className="text-ember">PASSWORDS DO NOT MATCH</span>
                </>
              )}
            </div>
          )}
        </label>

        <Turnstile onChange={setCaptchaToken} />
        <input type="hidden" name="cf-turnstile-response" value={captchaToken} />

        <AuthSubmitButton idleLabel="JOIN THE READER'S CIRCLE" pendingLabel="JOINING..." className="w-full mt-4" />
        <p className="text-center font-ui text-[10px] tracking-[0.1em] text-stone mt-2">
          Your privacy is guarded as fiercely as an unpublished manuscript.
        </p>

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
          SIGN IN WITH GOOGLE
        </a>
      </form>
    </div>
  );
}
