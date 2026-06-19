import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin, Plus, Star, Trash2 } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";
import {
  createAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Saved Addresses",
};

const ADDRESS_LABELS = ["Home", "Office", "Other"];

interface AddressesPageProps {
  searchParams: Promise<{ notice?: string; error?: string; new?: string }>;
}

export default async function AddressesPage({ searchParams }: AddressesPageProps) {
  const [session, params] = await Promise.all([
    requireSession("/account/addresses"),
    searchParams,
  ]);

  if (session.role === "ADMIN") redirect("/admin");

  const addresses = await db.address.findMany({
    where: { userId: session.userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  const showForm = params.new === "1" || addresses.length === 0;

  return (
    <div className="grain-overlay mx-auto w-full max-w-5xl px-4 py-14 md:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-ui text-xs tracking-[0.18em] text-gold">ACCOUNT</p>
          <h1 className="mt-2 font-title text-5xl text-ivory">Saved Addresses</h1>
          <p className="mt-2 font-body text-base text-stone">
            Manage delivery addresses for faster checkout.
          </p>
        </div>
        <div className="flex gap-3">
          {!showForm && (
            <Link
              href="/account/addresses?new=1"
              className="fx-button inline-flex items-center gap-2 rounded-full border border-gold bg-gold px-5 py-2.5 font-ui text-xs tracking-[0.14em] text-void transition hover:bg-gold-dim"
            >
              <Plus className="h-3.5 w-3.5" />
              ADD NEW
            </Link>
          )}
          <Link
            href="/account"
            className="fx-button inline-flex rounded-full border border-smoke bg-obsidian px-5 py-2.5 font-ui text-xs tracking-[0.14em] text-parchment transition hover:border-gold hover:text-gold"
          >
            BACK
          </Link>
        </div>
      </div>

      {/* Notices */}
      {params.notice && (
        <div className="mt-5 rounded-2xl border border-gold/35 bg-gold/10 px-4 py-3 font-body text-sm text-gold">
          {params.notice}
        </div>
      )}
      {params.error && (
        <div className="mt-5 rounded-2xl border border-ember/40 bg-ember/10 px-4 py-3 font-body text-sm text-ember">
          {params.error}
        </div>
      )}

      {/* Saved address cards */}
      {addresses.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <article
              key={address.id}
              className="editorial-panel relative rounded-[24px] p-5 transition"
            >
              {/* Default badge */}
              {address.isDefault && (
                <span className="mb-3 inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 font-ui text-[10px] tracking-[0.14em] text-gold">
                  <Star className="h-3 w-3 fill-gold" />
                  DEFAULT
                </span>
              )}

              {/* Label pill */}
              {!address.isDefault && (
                <span className="mb-3 inline-flex items-center gap-1 rounded-full border border-smoke px-2.5 py-0.5 font-ui text-[10px] tracking-[0.14em] text-stone">
                  <MapPin className="h-3 w-3" />
                  {address.label.toUpperCase()}
                </span>
              )}
              {address.isDefault && (
                <span className="ml-2 mb-3 inline-flex items-center gap-1 rounded-full border border-smoke px-2.5 py-0.5 font-ui text-[10px] tracking-[0.14em] text-stone">
                  <MapPin className="h-3 w-3" />
                  {address.label.toUpperCase()}
                </span>
              )}

              <div className="space-y-0.5 font-body text-sm leading-relaxed text-parchment">
                <p className="text-base font-semibold text-ivory">{address.fullName}</p>
                <p>{address.addressLine1}</p>
                {address.addressLine2 && <p>{address.addressLine2}</p>}
                <p>
                  {address.city}, {address.state} — {address.postalCode}
                </p>
                <p>{address.country}</p>
                <p className="pt-1 text-stone">{address.phone}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {!address.isDefault && (
                  <form action={setDefaultAddressAction}>
                    <input type="hidden" name="id" value={address.id} />
                    <button
                      type="submit"
                      className="fx-button rounded-full border border-smoke px-3 py-1.5 font-ui text-[10px] tracking-[0.12em] text-stone transition hover:border-gold hover:text-gold"
                    >
                      SET DEFAULT
                    </button>
                  </form>
                )}
                <Link
                  href={`/account/addresses/${address.id}/edit`}
                  className="fx-button rounded-full border border-smoke px-3 py-1.5 font-ui text-[10px] tracking-[0.12em] text-stone transition hover:border-gold hover:text-gold"
                >
                  EDIT
                </Link>
                <form action={deleteAddressAction}>
                  <input type="hidden" name="id" value={address.id} />
                  <button
                    type="submit"
                    className="fx-button inline-flex items-center gap-1 rounded-full border border-smoke px-3 py-1.5 font-ui text-[10px] tracking-[0.12em] text-stone transition hover:border-ember/60 hover:text-ember"
                  >
                    <Trash2 className="h-3 w-3" />
                    REMOVE
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Add new address form */}
      {showForm && (
        <section className="mt-8 editorial-panel rounded-[30px] p-6 md:p-8">
          <p className="font-ui text-xs tracking-[0.16em] text-gold">NEW ADDRESS</p>
          <h2 className="mt-2 font-title text-4xl text-ivory">Add a delivery address</h2>

          <form action={createAddressAction} className="mt-6 space-y-5">
            {/* Label + Default row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="font-ui text-xs tracking-[0.14em] text-parchment">ADDRESS TYPE</span>
                <select
                  name="label"
                  defaultValue="Home"
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
                  defaultChecked={addresses.length === 0}
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
                  defaultValue={session.fullName ?? ""}
                  className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
                />
              </label>
              <label className="block space-y-2">
                <span className="font-ui text-xs tracking-[0.14em] text-parchment">PHONE</span>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="+91 98765 43210"
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
                placeholder="House / Flat no., Street, Area"
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
                placeholder="Landmark, Apartment name"
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
                  placeholder="6-digit PIN code"
                  className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
                />
              </label>
              <label className="block space-y-2">
                <span className="font-ui text-xs tracking-[0.14em] text-parchment">CITY</span>
                <input
                  type="text"
                  name="city"
                  required
                  className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
                />
              </label>
              <label className="block space-y-2">
                <span className="font-ui text-xs tracking-[0.14em] text-parchment">STATE</span>
                <input
                  type="text"
                  name="state"
                  required
                  className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
                />
              </label>
              <label className="block space-y-2">
                <span className="font-ui text-xs tracking-[0.14em] text-parchment">COUNTRY</span>
                <input
                  type="text"
                  name="country"
                  defaultValue="India"
                  className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <AuthSubmitButton idleLabel="SAVE ADDRESS" pendingLabel="SAVING..." />
              {addresses.length > 0 && (
                <Link
                  href="/account/addresses"
                  className="fx-button rounded-full border border-smoke bg-obsidian px-5 py-3 font-ui text-xs tracking-[0.14em] text-parchment transition hover:border-gold hover:text-gold"
                >
                  CANCEL
                </Link>
              )}
            </div>
          </form>
        </section>
      )}

      {/* Empty state with no form */}
      {addresses.length === 0 && !showForm && (
        <div className="mt-10 rounded-2xl border border-smoke bg-void/70 p-8 text-center">
          <MapPin className="mx-auto h-8 w-8 text-stone/40" />
          <p className="mt-3 font-body text-base text-stone">No saved addresses yet.</p>
        </div>
      )}
    </div>
  );
}
