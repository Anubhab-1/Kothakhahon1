import type { Metadata } from "next";
import AboutPageClient from "@/components/about/AboutPageClient";

export const metadata: Metadata = {
  title: "Our Story & Vision | About Kothakhahon",
  description: "Learn about the mission, editorial team, and publishing philosophy of Kothakhahon, bringing Bengali literature to global readers.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return <AboutPageClient />;
}
