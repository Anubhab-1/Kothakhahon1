import { NextResponse } from "next/server";
import type { PublicSessionUser } from "@/lib/auth/public-session";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  const user: PublicSessionUser | null = session
    ? {
        id: session.userId,
        email: session.email,
        fullName: session.fullName,
        phone: session.phone,
        role: session.role,
      }
    : null;

  return NextResponse.json(
    { user },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
