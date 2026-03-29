import InfoPageShell from "@/components/site/InfoPageShell";

export const metadata = {
  title: "Return Policy",
};

export default function ReturnPolicyPage() {
  return (
    <InfoPageShell
      eyebrow="RETURN POLICY"
      title="Returns, Damaged Copies, And Order Issues"
      intro="We want the received copy to match what was ordered and arrive in good reading condition. If there is a genuine problem with the delivered item, contact us promptly."
    >
      <article className="fx-card rounded-[30px] border border-smoke bg-obsidian p-6 md:p-8">
        <h2 className="text-safe font-title text-3xl text-ivory">Eligible Issues</h2>
        <p className="mt-4 font-body text-base leading-relaxed text-parchment">
          Contact us if you receive the wrong title, a damaged copy, a missing item, or a package
          that is materially different from the order placed.
        </p>
      </article>

      <article className="fx-card rounded-[30px] border border-smoke bg-obsidian p-6 md:p-8">
        <h2 className="text-safe font-title text-3xl text-ivory">Reporting Window</h2>
        <p className="mt-4 font-body text-base leading-relaxed text-parchment">
          Report issues within 48 hours of delivery and include order ID, photos of the parcel or
          book condition, and a short description of the problem. This helps us resolve the case faster.
        </p>
      </article>

      <article className="fx-card rounded-[30px] border border-smoke bg-obsidian p-6 md:p-8">
        <h2 className="text-safe font-title text-3xl text-ivory">Non-returnable Cases</h2>
        <p className="mt-4 font-body text-base leading-relaxed text-parchment">
          We do not support open-ended returns after the book has been used, marked, damaged after
          delivery, or refused for reasons unrelated to condition or fulfillment accuracy.
        </p>
      </article>
    </InfoPageShell>
  );
}
