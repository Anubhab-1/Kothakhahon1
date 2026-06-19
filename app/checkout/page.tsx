import type { Metadata } from "next";
import CheckoutClient from "@/app/checkout/CheckoutClient";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const session = await getSession();

  const savedAddresses = session?.userId
    ? await db.address.findMany({
        where: { userId: session.userId },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      })
    : [];

  let defaultAddress = null;
  if (savedAddresses.length > 0) {
    defaultAddress = savedAddresses.find((address) => address.isDefault) ?? savedAddresses[0];
  }

  return (
    <CheckoutClient
      defaultAddress={
        defaultAddress
          ? {
              fullName: defaultAddress.fullName,
              phone: defaultAddress.phone,
              addressLine1: defaultAddress.addressLine1,
              addressLine2: defaultAddress.addressLine2 ?? undefined,
              city: defaultAddress.city,
              state: defaultAddress.state,
              postalCode: defaultAddress.postalCode,
              country: defaultAddress.country,
            }
          : undefined
      }
      defaultAddressId={defaultAddress?.id ?? undefined}
      savedAddresses={savedAddresses.map((address) => ({
        id: address.id,
        label: address.label,
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 ?? undefined,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
      }))}
      userEmail={session?.email}
      userName={session?.fullName ?? undefined}
    />
  );
}
