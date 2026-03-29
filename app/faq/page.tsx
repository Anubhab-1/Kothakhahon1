import InfoPageShell from "@/components/site/InfoPageShell";

export const metadata = {
  title: "Reader FAQ",
};

export default function FaqPage() {
  return (
    <InfoPageShell
      eyebrow="READER FAQ"
      title="Common Questions From Readers"
      intro="These are the quick answers readers usually need before ordering, writing in, or waiting on a dispatch update."
    >
      <article className="fx-card rounded-[30px] border border-smoke bg-obsidian p-6 md:p-8">
        <h2 className="text-safe font-title text-3xl text-ivory">Do I Need An Account To Order?</h2>
        <p className="mt-4 font-body text-base leading-relaxed text-parchment">
          No. Guest checkout is available. Creating an account simply helps you reuse details and
          view matching orders later.
        </p>
      </article>

      <article className="fx-card rounded-[30px] border border-smoke bg-obsidian p-6 md:p-8">
        <h2 className="text-safe font-title text-3xl text-ivory">Is Cash On Delivery Available?</h2>
        <p className="mt-4 font-body text-base leading-relaxed text-parchment">
          Yes, for eligible India orders. Availability depends on the delivery destination and current
          checkout configuration.
        </p>
      </article>

      <article className="fx-card rounded-[30px] border border-smoke bg-obsidian p-6 md:p-8">
        <h2 className="text-safe font-title text-3xl text-ivory">How Do I Ask About A Book Or Order?</h2>
        <p className="mt-4 font-body text-base leading-relaxed text-parchment">
          Use the contact page or email the editorial desk with the title name and order ID, if applicable.
          We usually reply within 2 to 3 business days.
        </p>
      </article>
    </InfoPageShell>
  );
}
