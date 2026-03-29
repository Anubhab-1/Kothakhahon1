import InfoPageShell from "@/components/site/InfoPageShell";

export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
  return (
    <InfoPageShell
      eyebrow="PRIVACY POLICY"
      title="What We Collect And Why"
      intro="Kothakhahon collects only the information required to run the storefront, process orders, respond to submissions, and manage account access."
    >
      <article className="fx-card rounded-[30px] border border-smoke bg-obsidian p-6 md:p-8">
        <h2 className="text-safe font-title text-3xl text-ivory">Data We Collect</h2>
        <p className="mt-4 font-body text-base leading-relaxed text-parchment">
          Depending on the action you take, we may store name, email, shipping details, account
          credentials, manuscript details, newsletter subscriptions, and order information.
        </p>
      </article>

      <article className="fx-card rounded-[30px] border border-smoke bg-obsidian p-6 md:p-8">
        <h2 className="text-safe font-title text-3xl text-ivory">How It Is Used</h2>
        <p className="mt-4 font-body text-base leading-relaxed text-parchment">
          We use your data to fulfill orders, provide support, maintain admin and reader accounts,
          and send updates you explicitly requested. We do not treat reader data as a resale asset.
        </p>
      </article>

      <article className="fx-card rounded-[30px] border border-smoke bg-obsidian p-6 md:p-8">
        <h2 className="text-safe font-title text-3xl text-ivory">Communication</h2>
        <p className="mt-4 font-body text-base leading-relaxed text-parchment">
          Newsletter communication is optional. Order-related or support-related emails may still be
          sent when necessary to complete a transaction or respond to an enquiry.
        </p>
      </article>
    </InfoPageShell>
  );
}
