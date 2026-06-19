"use client";

import { useEffect, useRef, useState } from "react";

interface TurnstileProps {
  onChange: (token: string) => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export default function Turnstile({ onChange }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setWidgetId] = useState<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) {
      return;
    }

    let isMounted = true;
    let turnstileWidgetId: string | null = null;

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return;

      try {
        containerRef.current.innerHTML = "";

        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            if (isMounted) onChange(token);
          },
          "expired-callback": () => {
            if (isMounted) onChange("");
          },
          "error-callback": () => {
            if (isMounted) onChange("");
          },
        });

        turnstileWidgetId = id;
        setWidgetId(id);
      } catch (err) {
        console.error("Failed to render Turnstile widget:", err);
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      let script = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]') as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      const checkLoaded = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkLoaded);
          renderWidget();
        }
      }, 100);

      const handleScriptLoad = () => {
        clearInterval(checkLoaded);
        renderWidget();
      };

      script.addEventListener("load", handleScriptLoad);

      return () => {
        clearInterval(checkLoaded);
        isMounted = false;
        if (script) {
          script.removeEventListener("load", handleScriptLoad);
        }
        if (turnstileWidgetId && window.turnstile) {
          try {
            window.turnstile.remove(turnstileWidgetId);
          } catch {
            // ignore
          }
        }
      };
    }

    return () => {
      isMounted = false;
      if (turnstileWidgetId && window.turnstile) {
        try {
          window.turnstile.remove(turnstileWidgetId);
        } catch {
          // ignore
        }
      }
    };
  }, [siteKey, onChange]);

  if (!siteKey) {
    return null;
  }

  return (
    <div className="flex justify-center py-2">
      <div ref={containerRef} className="cf-turnstile" />
    </div>
  );
}
