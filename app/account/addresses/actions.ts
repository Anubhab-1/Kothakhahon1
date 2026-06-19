"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

function optionalString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string") return "";
  return value.trim();
}

export async function createAddressAction(formData: FormData) {
  const session = await requireSession("/account/addresses");

  const label = optionalString(formData, "label") || "Home";
  const fullName = optionalString(formData, "fullName");
  const phone = optionalString(formData, "phone");
  const addressLine1 = optionalString(formData, "addressLine1");
  const addressLine2 = optionalString(formData, "addressLine2");
  const city = optionalString(formData, "city");
  const state = optionalString(formData, "state");
  const postalCode = optionalString(formData, "postalCode");
  const country = optionalString(formData, "country") || "India";
  const makeDefault = formData.get("isDefault") === "on";

  if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
    redirect("/account/addresses?error=All+required+fields+must+be+filled.");
  }

  // Count existing addresses — first one is always default
  const existingCount = await db.address.count({
    where: { userId: session.userId },
  });
  const isDefault = makeDefault || existingCount === 0;

  await db.$transaction(async (tx) => {
    // If new address is being set as default, unset any current default
    if (isDefault) {
      await tx.address.updateMany({
        where: { userId: session.userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    await tx.address.create({
      data: {
        userId: session.userId,
        label,
        fullName,
        phone,
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        state,
        postalCode,
        country,
        isDefault,
      },
    });
  });

  revalidatePath("/account/addresses");
  redirect("/account/addresses?notice=Address+saved.");
}

export async function updateAddressAction(formData: FormData) {
  const session = await requireSession("/account/addresses");

  const id = optionalString(formData, "id");
  const label = optionalString(formData, "label") || "Home";
  const fullName = optionalString(formData, "fullName");
  const phone = optionalString(formData, "phone");
  const addressLine1 = optionalString(formData, "addressLine1");
  const addressLine2 = optionalString(formData, "addressLine2");
  const city = optionalString(formData, "city");
  const state = optionalString(formData, "state");
  const postalCode = optionalString(formData, "postalCode");
  const country = optionalString(formData, "country") || "India";
  const makeDefault = formData.get("isDefault") === "on";

  if (!id || !fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
    redirect("/account/addresses?error=All+required+fields+must+be+filled.");
  }

  // Ensure the address belongs to this user
  const existing = await db.address.findFirst({
    where: { id, userId: session.userId },
  });
  if (!existing) {
    redirect("/account/addresses?error=Address+not+found.");
  }

  await db.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.address.updateMany({
        where: { userId: session.userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    await tx.address.update({
      where: { id },
      data: {
        label,
        fullName,
        phone,
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        state,
        postalCode,
        country,
        ...(makeDefault ? { isDefault: true } : {}),
      },
    });
  });

  revalidatePath("/account/addresses");
  redirect("/account/addresses?notice=Address+updated.");
}

export async function deleteAddressAction(formData: FormData) {
  const session = await requireSession("/account/addresses");
  const id = optionalString(formData, "id");

  if (!id) redirect("/account/addresses");

  const address = await db.address.findFirst({
    where: { id, userId: session.userId },
  });
  if (!address) redirect("/account/addresses?error=Address+not+found.");

  await db.address.delete({ where: { id } });

  // If we deleted the default, promote the next oldest one
  if (address.isDefault) {
    const next = await db.address.findFirst({
      where: { userId: session.userId },
      orderBy: { createdAt: "asc" },
    });
    if (next) {
      await db.address.update({
        where: { id: next.id },
        data: { isDefault: true },
      });
    }
  }

  revalidatePath("/account/addresses");
  redirect("/account/addresses?notice=Address+removed.");
}

export async function setDefaultAddressAction(formData: FormData) {
  const session = await requireSession("/account/addresses");
  const id = optionalString(formData, "id");
  if (!id) redirect("/account/addresses");

  const address = await db.address.findFirst({
    where: { id, userId: session.userId },
  });
  if (!address) redirect("/account/addresses?error=Address+not+found.");

  await db.$transaction([
    db.address.updateMany({
      where: { userId: session.userId, isDefault: true },
      data: { isDefault: false },
    }),
    db.address.update({
      where: { id },
      data: { isDefault: true },
    }),
  ]);

  revalidatePath("/account/addresses");
  redirect("/account/addresses?notice=Default+address+updated.");
}
