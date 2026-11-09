import type { Metadata } from "next";
import PricingPage from "@/modules/pricing/pricing-page";

export const metadata: Metadata = { title: "Pricing · CourseIt", description: "Join any built course free. Build your own from $4.99 a month (₹199 in India)." };

export default function Page() {
  return <PricingPage />;
}
