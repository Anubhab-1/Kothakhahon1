"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/admin";

function buildRedirect(path: string, params: Record<string, string>) {
  return `${path}?${new URLSearchParams(params).toString()}`;
}

export async function createCouponAction(formData: FormData) {
  await requireAdminSession();

  const code = (formData.get("code") as string).trim().toUpperCase();
  const type = formData.get("type") as "percent" | "flat";
  const value = parseFloat(formData.get("value") as string);
  const minOrderAmount = formData.get("minOrderAmount") ? parseFloat(formData.get("minOrderAmount") as string) : null;
  const maxUses = formData.get("maxUses") ? parseInt(formData.get("maxUses") as string, 10) : null;
  const expiresAt = formData.get("expiresAt") ? new Date(formData.get("expiresAt") as string) : null;

  if (!code || !type || !value || value <= 0) {
    redirect(buildRedirect("/admin/coupons", { error: "Code, type, and a positive value are required." }));
  }

  if (type === "percent" && value > 100) {
    redirect(buildRedirect("/admin/coupons", { error: "Percentage discount cannot exceed 100%." }));
  }

  try {
    await db.coupon.create({
      data: { code, type, value, minOrderAmount, maxUses, expiresAt },
    });
  } catch {
    redirect(buildRedirect("/admin/coupons", { error: "Coupon code already exists." }));
  }

  revalidatePath("/admin/coupons");
  redirect(buildRedirect("/admin/coupons", { saved: "1" }));
}

export async function toggleCouponAction(formData: FormData) {
  await requireAdminSession();
  const id = formData.get("id") as string;
  const coupon = await db.coupon.findUnique({ where: { id }, select: { isActive: true } });
  if (!coupon) return;
  await db.coupon.update({ where: { id }, data: { isActive: !coupon.isActive } });
  revalidatePath("/admin/coupons");
}

export async function deleteCouponAction(formData: FormData) {
  await requireAdminSession();
  const id = formData.get("id") as string;
  await db.coupon.delete({ where: { id } });
  revalidatePath("/admin/coupons");
}
