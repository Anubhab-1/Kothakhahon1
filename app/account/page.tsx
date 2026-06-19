import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";
import { logoutAction, updateAccountProfileAction } from "@/app/auth/actions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDisplayDate } from "@/lib/date";
import {
  getOrderStatusShortLabel,
  getPaymentMethodShortLabel,
  getPaymentStatusShortLabel,
} from "@/lib/orders";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Account",
};

interface AccountPageProps {
  searchParams: Promise<{
    notice?: string;
    error?: string;
  }>;
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const [session, params] = await Promise.all([requireSession("/account"), searchParams]);

  if (session.role === "ADMIN") {
    redirect("/admin");
  }

  // Fetch full user record so we have phone (not stored in session cookie)
  const [user, orders] = await Promise.all([
    db.user.findUnique({
      where: { id: session.userId },
      select: { phone: true },
    }),
    db.order.findMany({
      where: {
        OR: [
          { userId: session.userId },
          { userId: null, customerEmail: session.email },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { items: true },
    }),
  ]);

  return (
    <div className="grain-overlay mx-auto w-full max-w-7xl px-4 py-14 md:px-8">
      <section className="editorial-panel rounded-[30px] p-6 md:p-8">
        <p className="font-ui text-xs tracking-[0.18em] text-gold">ACCOUNT</p>
        <h1 className="mt-3 text-safe font-title text-5xl text-ivory md:text-6xl">Welcome back, {session.fullName ?? "Reader"}.</h1>
        <p className="mt-3 max-w-3xl font-body text-lg text-stone">
          This is your reader account for profile changes and order tracking. Orders placed while signed in attach directly here, and older guest orders on the same email still appear automatically.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-xs">
          <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 font-ui tracking-[0.13em] text-gold">
            {session.role}
          </span>
          <span className="rounded-full border border-smoke px-3 py-1 font-ui tracking-[0.13em] text-parchment">
            {session.email}
          </span>
          <Link
            href="/account/addresses"
            className="inline-flex items-center gap-1.5 rounded-full border border-smoke px-3 py-1 font-ui tracking-[0.13em] text-parchment transition hover:border-gold hover:text-gold"
          >
            ⊕ Addresses
          </Link>
          <Link
            href="/account/wishlist"
            className="inline-flex items-center gap-1.5 rounded-full border border-smoke px-3 py-1 font-ui tracking-[0.13em] text-parchment transition hover:border-gold hover:text-gold"
          >
            ♥ Wishlist
          </Link>
        </div>
      </section>

      {params.notice ? (
        <div className="mt-6 rounded-2xl border border-gold/35 bg-gold/10 px-4 py-3 font-body text-sm text-gold">
          {params.notice}
        </div>
      ) : null}

      {params.error ? (
        <div className="mt-6 rounded-2xl border border-ember/40 bg-ember/10 px-4 py-3 font-body text-sm text-ember">
          {params.error}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="editorial-panel rounded-[30px] p-6 md:p-8">
          <p className="font-ui text-xs tracking-[0.16em] text-gold">PROFILE</p>
          <h2 className="mt-3 text-safe font-title text-4xl text-ivory">Account details</h2>
          <form action={updateAccountProfileAction} className="mt-6 space-y-5">
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
              <span className="font-ui text-xs tracking-[0.14em] text-parchment">EMAIL</span>
              <input
                type="email"
                value={session.email}
                disabled
                className="w-full rounded-xl border border-smoke bg-obsidian px-3 py-2.5 font-body text-base text-stone"
              />
            </label>

            <label className="block space-y-2">
              <span className="font-ui text-xs tracking-[0.14em] text-parchment">PHONE NUMBER</span>
              <input
                type="tel"
                name="phone"
                defaultValue={user?.phone ?? ""}
                placeholder="+91 98765 43210"
                className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="font-ui text-xs tracking-[0.14em] text-parchment">NEW PASSWORD</span>
                <input
                  type="password"
                  name="newPassword"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
                  placeholder="Leave blank to keep current"
                />
              </label>

              <label className="block space-y-2">
                <span className="font-ui text-xs tracking-[0.14em] text-parchment">CONFIRM PASSWORD</span>
                <input
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-smoke bg-void px-3 py-2.5 font-body text-base text-ivory outline-none ring-gold transition focus:ring-1"
                  placeholder="Repeat new password"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <AuthSubmitButton idleLabel="SAVE PROFILE" pendingLabel="SAVING..." />
            </div>
          </form>

          <form action={logoutAction} className="mt-3">
            <button
              type="submit"
              className="fx-button rounded-full border border-smoke bg-obsidian px-5 py-3 font-ui text-xs tracking-[0.14em] text-parchment transition hover:border-gold hover:text-gold"
            >
              LOG OUT
            </button>
          </form>
        </section>

        <section className="editorial-panel rounded-[30px] p-6 md:p-8">
          <p className="font-ui text-xs tracking-[0.16em] text-gold">MATCHING ORDERS</p>
          <h2 className="mt-3 text-safe font-title text-4xl text-ivory">Orders on this email</h2>
          <p className="mt-3 font-body text-base text-stone">
            Signed-in orders and legacy guest orders on this email appear here together.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/account/orders"
              className="fx-button inline-flex rounded-full border border-gold bg-gold px-5 py-3 font-ui text-xs tracking-[0.14em] text-void transition hover:bg-gold-dim"
            >
              VIEW ALL ORDERS
            </Link>
          </div>

          {orders.length > 0 ? (
            <div className="mt-6 space-y-4">
              {orders.map((order) => (
                <article key={order.id} className="rounded-2xl border border-smoke bg-void/70 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <p className="font-ui text-[11px] tracking-[0.14em] text-gold">
                          {getOrderStatusShortLabel(order.status)}
                        </p>
                        <p className="font-ui text-[11px] tracking-[0.14em] text-stone">
                          {getPaymentMethodShortLabel(order.paymentMethod)}
                        </p>
                        <p className="font-ui text-[11px] tracking-[0.14em] text-stone">
                          {getPaymentStatusShortLabel(order.paymentStatus)}
                        </p>
                      </div>
                      <p className="mt-2 font-mono text-xs text-stone">{order.id}</p>
                      <p className="mt-1 font-body text-sm text-stone">
                        {order.items.length} book{order.items.length > 1 ? "s" : ""} · {formatDisplayDate(
                          order.paymentCollectedAt?.toISOString() ??
                            order.paidAt?.toISOString() ??
                            order.createdAt.toISOString(),
                          "Unknown",
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-title text-3xl text-ivory">{formatINR(Number(order.totalAmount))}</p>
                      <p className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-smoke">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} total item{order.items.reduce((sum, item) => sum + item.quantity, 0) > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                        <div>
                          <p className="font-body text-parchment">{item.bookTitle}</p>
                          <p className="font-mono text-xs text-stone">Qty {item.quantity}</p>
                        </div>
                        <p className="font-mono text-xs text-parchment">{formatINR(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="fx-button inline-flex rounded-full border border-smoke bg-obsidian px-4 py-2 font-ui text-[11px] tracking-[0.14em] text-parchment transition hover:border-gold hover:text-gold"
                    >
                      VIEW ORDER
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-smoke bg-void/70 p-6">
              <p className="font-body text-base text-stone">
                No orders have been placed with this email yet. Once you checkout with this address, orders will appear here.
              </p>
              <Link
                href="/books"
                className="fx-button mt-5 inline-flex rounded-full border border-gold bg-gold px-5 py-3 font-ui text-xs tracking-[0.14em] text-void transition hover:bg-gold-dim"
              >
                BROWSE CATALOG
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
