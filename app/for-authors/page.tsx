import type { Metadata } from "next";
import ForAuthorsPageClient from "@/components/for-authors/ForAuthorsPageClient";

export const metadata: Metadata = {
  title: "Submit Your Manuscript | Author Guidelines",
  description: "We are always looking for fresh voices in Bengali literature. Review our manuscript submission guidelines and upload your draft.",
  alternates: {
    canonical: "/for-authors",
  },
};

export default function ForAuthorsPage() {
  return <ForAuthorsPageClient />;
}
