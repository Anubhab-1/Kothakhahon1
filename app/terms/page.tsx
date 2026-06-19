import type { Metadata } from "next";
import InfoPageShell from "@/components/site/InfoPageShell";

export const metadata: Metadata = {
  title: "Terms & Conditions | Kothakhahon",
  description: "Read the terms and conditions governing the purchase of books, digital goods, and site usage on Kothakhahon.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <InfoPageShell
      eyebrow="TERMS & CONDITIONS"
      title="Storefront Terms For Readers And Customers"
      intro="Using the Kothakhahon storefront means agreeing to the ordering, account, and contact practices described here."
    >
      <article className="fx-card rounded-[30px] border border-smoke bg-obsidian p-6 md:p-8">
        <h2 className="text-safe font-title text-3xl text-ivory">Orders</h2>
        <p className="mt-4 font-body text-base leading-relaxed text-parchment">
          Orders are subject to title availability, pricing accuracy, payment confirmation, and
          successful address validation. If there is an issue with availability or order data, we may contact you before dispatch.
        </p>
      </article>

      <article className="fx-card rounded-[30px] border border-smoke bg-obsidian p-6 md:p-8">
        <h2 className="text-safe font-title text-3xl text-ivory">Accounts</h2>
        <p className="mt-4 font-body text-base leading-relaxed text-parchment">
          Readers are responsible for maintaining the confidentiality of their account credentials.
          Administrative access is restricted to approved staff accounts.
        </p>
      </article>

      <article className="fx-card rounded-[30px] border border-smoke bg-obsidian p-6 md:p-8">
        <h2 className="text-safe font-title text-3xl text-ivory">Catalog And Content</h2>
        <p className="mt-4 font-body text-base leading-relaxed text-parchment">
          We aim for accurate metadata, but descriptions, pricing, availability, and release timing
          can change. We reserve the right to correct errors and update catalog information when needed.
        </p>
      </article>
    </InfoPageShell>
  );
}
