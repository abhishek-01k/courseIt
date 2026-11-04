import type { Metadata } from "next";
import PricingPage from "@/modules/pricing/pricing-page";

export const metadata: Metadata = { title: "Pricing · CourseIt", description: "Join any built course free. Build your own from $19 a month (₹499 in India)." };

export default function Page() {
  return <PricingPage />;
}
