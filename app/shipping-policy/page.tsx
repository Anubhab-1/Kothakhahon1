import InfoPageShell from "@/components/site/InfoPageShell";

export const metadata = {
  title: "Shipping Policy",
};

export default function ShippingPolicyPage() {
  return (
    <InfoPageShell
      eyebrow="SHIPPING POLICY"
      title="How Orders Move From Our Desk To Your Shelf"
      intro="Kothakhahon is a direct-to-reader storefront. Orders are processed from Kolkata and shipped across India using the address details entered at checkout."
      aside={
        <div className="editorial-panel rounded-[30px] p-6">
          <p className="font-ui text-xs tracking-[0.16em] text-gold">AT A GLANCE</p>
          <ul className="mt-4 space-y-3 font-body text-sm text-stone">
            <li>Orders are packed after payment confirmation or COD acceptance.</li>
            <li>Cash on Delivery is available only on eligible India orders.</li>
            <li>Delivery timelines vary by city, courier network, and holiday schedules.</li>
            <li>Incorrect addresses can delay dispatch or trigger re-shipping costs.</li>
          </ul>
        </div>
      }
    >
      <article className="fx-card rounded-[30px] border border-smoke bg-obsidian p-6 md:p-8">
        <h2 className="text-safe font-title text-3xl text-ivory">Dispatch Window</h2>
        <p className="mt-4 font-body text-base leading-relaxed text-parchment">
          Orders are generally prepared within 2 to 4 working days. During launches, book fairs,
          festival sales, and high-volume periods, dispatch can take longer.
        </p>
      </article>

      <article className="fx-card rounded-[30px] border border-smoke bg-obsidian p-6 md:p-8">
        <h2 className="text-safe font-title text-3xl text-ivory">Shipping Scope</h2>
        <p className="mt-4 font-body text-base leading-relaxed text-parchment">
          We currently prioritize shipping within India. If you need an international order, contact
          the editorial desk before placing it so we can confirm availability and shipping feasibility.
        </p>
      </article>

      <article className="fx-card rounded-[30px] border border-smoke bg-obsidian p-6 md:p-8">
        <h2 className="text-safe font-title text-3xl text-ivory">Address Accuracy</h2>
        <p className="mt-4 font-body text-base leading-relaxed text-parchment">
          Please enter the receiver name, complete address, phone number, and pin code correctly.
          We cannot guarantee delivery if the information supplied at checkout is incomplete or inaccurate.
        </p>
      </article>
    </InfoPageShell>
  );
}
