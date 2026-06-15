"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import AuthSubmitButton from "./AuthSubmitButton";
import { registerAction } from "@/app/auth/actions";
import { Eye, EyeOff, ShieldAlert, CheckCircle, HelpCircle } from "lucide-react";

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
      setClientError("Password must be at least 8 characters.");
      setShake(true);
      return;
    }

    if (password !== confirmPassword) {
      e.preventDefault();
      setClientError("Passwords do not match.");
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

        <AuthSubmitButton idleLabel="CREATE ACCOUNT" pendingLabel="CREATING..." className="w-full mt-4" />
      </form>
    </div>
  );
}
