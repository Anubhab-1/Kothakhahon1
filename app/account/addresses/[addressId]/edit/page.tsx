import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";
import { updateAddressAction } from "../../actions";

export const metadata: Metadata = { title: "Edit Address" };

const ADDRESS_LABELS = ["Home", "Office", "Other"];

interface EditAddressPageProps {
  params: Promise<{ addressId: string }>;
}

export default async function EditAddressPage({ params }: EditAddressPageProps) {
  const [session, { addressId }] = await Promise.all([
    requireSession("/account/addresses"),
    params,
  ]);

  if (session.role === "ADMIN") redirect("/admin");

  const address = await db.address.findFirst({
    where: { id: addressId, userId: session.userId },
  });

  if (!address) notFound();

  return (
    <div className="grain-overlay mx-auto w-full max-w-2xl px-4 py-14 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-ui text-xs tracking-[0.18em] text-gold">ACCOUNT / ADDRESSES</p>
          <h1 className="mt-2 font-title text-5xl text-ivory">Edit Address</h1>
        </div>
        <Link
          href="/account/addresses"
          className="fx-button rounded-full border border-smoke bg-obsidian px-5 py-2.5 font-ui text-xs tracking-[0.14em] text-parchment transition hover:border-gold hover:text-gold"
        >
          CANCEL
        </Link>
      </div>

      <section className="mt-8 editorial-panel rounded-[30px] p-6 md:p-8">
        <form action={updateAddressAction} className="space-y-5">
          <input type="hidden" name="id" value={address.id} />

          {/* Label + Default */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="font-ui text-xs tracking-[0.14em] text-parchment">ADDRESS TYPE</span>
              <select
                name="label"
                defaultValue={address.label}
                className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
              >
                {ADDRESS_LABELS.map((l) => (
                  <option key={l} value={l} className="bg-obsidian">
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                name="isDefault"
                defaultChecked={address.isDefault}
                className="h-4 w-4 accent-gold"
              />
              <span className="font-ui text-xs tracking-[0.14em] text-parchment">
                SET AS DEFAULT ADDRESS
              </span>
            </label>
          </div>

          {/* Name + Phone */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="font-ui text-xs tracking-[0.14em] text-parchment">FULL NAME</span>
              <input
                type="text"
                name="fullName"
                required
                defaultValue={address.fullName}
                className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
              />
            </label>
            <label className="block space-y-2">
              <span className="font-ui text-xs tracking-[0.14em] text-parchment">PHONE</span>
              <input
                type="tel"
                name="phone"
                required
                defaultValue={address.phone}
                className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
              />
            </label>
          </div>

          {/* Address lines */}
          <label className="block space-y-2">
            <span className="font-ui text-xs tracking-[0.14em] text-parchment">ADDRESS LINE 1</span>
            <input
              type="text"
              name="addressLine1"
              required
              defaultValue={address.addressLine1}
              className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
            />
          </label>

          <label className="block space-y-2">
            <span className="font-ui text-xs tracking-[0.14em] text-parchment">
              ADDRESS LINE 2 <span className="text-stone/60">(optional)</span>
            </span>
            <input
              type="text"
              name="addressLine2"
              defaultValue={address.addressLine2 ?? ""}
              className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
            />
          </label>

          {/* City / State / Pincode / Country */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="font-ui text-xs tracking-[0.14em] text-parchment">POSTAL CODE</span>
              <input
                type="text"
                name="postalCode"
                required
                defaultValue={address.postalCode}
                className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
              />
            </label>
            <label className="block space-y-2">
              <span className="font-ui text-xs tracking-[0.14em] text-parchment">CITY</span>
              <input
                type="text"
                name="city"
                required
                defaultValue={address.city}
                className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
              />
            </label>
            <label className="block space-y-2">
              <span className="font-ui text-xs tracking-[0.14em] text-parchment">STATE</span>
              <input
                type="text"
                name="state"
                required
                defaultValue={address.state}
                className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
              />
            </label>
            <label className="block space-y-2">
              <span className="font-ui text-xs tracking-[0.14em] text-parchment">COUNTRY</span>
              <input
                type="text"
                name="country"
                defaultValue={address.country}
                className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <AuthSubmitButton idleLabel="UPDATE ADDRESS" pendingLabel="SAVING..." />
            <Link
              href="/account/addresses"
              className="fx-button rounded-full border border-smoke bg-obsidian px-5 py-3 font-ui text-xs tracking-[0.14em] text-parchment transition hover:border-gold hover:text-gold"
            >
              CANCEL
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
