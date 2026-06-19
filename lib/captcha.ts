import { logger } from "@/lib/logger";

export async function verifyCaptcha(token?: string | null): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    if (process.env.NODE_ENV !== "production") {
      logger.warn("TURNSTILE_SECRET_KEY is not set. Mocking CAPTCHA validation success.");
    }
    return true;
  }

  if (!token) {
    return false;
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    if (!response.ok) {
      throw new Error(`Turnstile request failed with status: ${response.status}`);
    }

    const data = await response.json();
    return !!data.success;
  } catch (error) {
    logger.error("Cloudflare Turnstile validation failed", error);
    return false;
  }
}
