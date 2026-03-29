"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { PublicSessionUser } from "@/lib/auth/public-session";

interface SessionResponse {
  user: PublicSessionUser | null;
}

const PublicSessionContext = createContext<PublicSessionUser | null>(null);
const SESSION_CACHE_TTL_MS = 30_000;
const sessionSensitivePaths = ["/account", "/admin", "/login", "/register", "/checkout"];

let cachedUser: PublicSessionUser | null = null;
let cachedAt = 0;
let cacheReady = false;

function shouldRefreshImmediately(pathname: string) {
  return sessionSensitivePaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function PublicSessionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<PublicSessionUser | null>(cacheReady ? cachedUser : null);

  useEffect(() => {
    const mustRefresh = shouldRefreshImmediately(pathname);
    const cacheStillFresh = cacheReady && Date.now() - cachedAt < SESSION_CACHE_TTL_MS;

    if (!mustRefresh && cacheStillFresh) {
      setUser(cachedUser);
      return;
    }

    const controller = new AbortController();

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load session.");
        }

        const payload = (await response.json()) as SessionResponse;
        cachedUser = payload.user ?? null;
        cachedAt = Date.now();
        cacheReady = true;

        if (!controller.signal.aborted) {
          setUser(cachedUser);
        }
      } catch {
        if (!controller.signal.aborted) {
          cachedUser = null;
          cachedAt = Date.now();
          cacheReady = true;
          setUser(null);
        }
      }
    }

    void loadSession();

    return () => controller.abort();
  }, [pathname]);

  return <PublicSessionContext.Provider value={user}>{children}</PublicSessionContext.Provider>;
}

export function usePublicSession() {
  return useContext(PublicSessionContext);
}
