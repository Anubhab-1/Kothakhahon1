import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env, getSiteUrlString } from "@/lib/env";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("google_oauth_state")?.value;

  // 1. Validate State (CSRF check)
  if (!state || !savedState || state !== savedState) {
    return redirectWithError("Authentication state mismatch. Please try signing in again.");
  }

  if (!code) {
    return redirectWithError("No authorization code provided from Google.");
  }

  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return redirectWithError("Google OAuth is not configured on the server.");
  }

  const redirectUri = `${getSiteUrlString()}/api/auth/google/callback`;

  try {
    // 2. Exchange authorization code for token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errorData = await tokenRes.json().catch(() => ({}));
      console.error("Token exchange failed:", errorData);
      return redirectWithError("Failed to exchange authentication code.");
    }

    const tokens = await tokenRes.json();
    const accessToken = tokens.access_token;

    if (!accessToken) {
      return redirectWithError("Access token was not returned from Google.");
    }

    // 3. Fetch user information
    const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userinfoRes.ok) {
      return redirectWithError("Failed to retrieve user profile details from Google.");
    }

    const userInfo = await userinfoRes.json();
    const email = userInfo.email?.toLowerCase();
    const name = userInfo.name;

    if (!email) {
      return redirectWithError("Google account did not return a valid email address.");
    }

    // 4. Find or create user in DB
    let user = await db.user.findUnique({
      where: { email },
    });

    if (user) {
      // If user exists and is inactive, block login
      if (!user.isActive) {
        return redirectWithError("This account has been deactivated.");
      }

      // Update name/verification status if missing, and update lastLoginAt
      const updateData: { lastLoginAt: Date; fullName?: string; emailVerifiedAt?: Date } = { lastLoginAt: new Date() };
      if (!user.fullName && name) {
        updateData.fullName = name;
      }
      if (!user.emailVerifiedAt) {
        updateData.emailVerifiedAt = new Date();
      }

      user = await db.user.update({
        where: { id: user.id },
        data: updateData,
      });
    } else {
      // Create user
      user = await db.user.create({
        data: {
          email,
          fullName: name || null,
          passwordHash: "OAUTH_GOOGLE_ACCOUNT", // Safe placeholder preventing password form login
          role: "CUSTOMER",
          isActive: true,
          emailVerifiedAt: new Date(),
          lastLoginAt: new Date(),
        },
      });
    }

    // 5. Claim any guest orders with this email
    await db.order.updateMany({
      where: {
        userId: null,
        customerEmail: email,
      },
      data: {
        userId: user.id,
      },
    });

    // 6. Create custom session
    await createSession(user);

    // 7. Clean up cookie and redirect to target page
    cookieStore.delete("google_oauth_state");
    return NextResponse.redirect(`${getSiteUrlString()}${user.role === "ADMIN" ? "/admin" : "/account"}`);
  } catch (error) {
    console.error("Google authentication callback error:", error);
    return redirectWithError("An internal error occurred during Google authentication.");
  }
}

function redirectWithError(message: string) {
  return NextResponse.redirect(
    `${getSiteUrlString()}/login?error=${encodeURIComponent(message)}`
  );
}
