import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  // Brute-force / enumeration guard: 5 attempts per IP per minute
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
  const rl = checkRateLimit({ key: `coupon:${ip}`, limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many coupon attempts. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase();
  const subtotal = parseFloat(req.nextUrl.searchParams.get("subtotal") ?? "0");

  if (!code) {
    return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });
  }

  const coupon = await db.coupon.findUnique({
    where: { code },
    select: {
      id: true,
      code: true,
      type: true,
      value: true,
      minOrderAmount: true,
      maxUses: true,
      usedCount: true,
      expiresAt: true,
      isActive: true,
    },
  });

  if (!coupon || !coupon.isActive) {
    return NextResponse.json({ error: "Invalid or expired coupon code." }, { status: 404 });
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ error: "This coupon has expired." }, { status: 400 });
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ error: "This coupon has reached its usage limit." }, { status: 400 });
  }

  if (coupon.minOrderAmount !== null && subtotal < coupon.minOrderAmount) {
    return NextResponse.json(
      { error: `Minimum order of ₹${coupon.minOrderAmount} required for this coupon.` },
      { status: 400 },
    );
  }

  const discount =
    coupon.type === "percent"
      ? Math.round((subtotal * coupon.value) / 100)
      : Math.min(coupon.value, subtotal);

  return NextResponse.json({
    couponId: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount,
  });
}
