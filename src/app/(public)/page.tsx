import LandingPage from "@/modules/landingPage/landing-page";
import BrandJsonLd from "../../../seo/site/brand-jsonld";

export default function Page() {
  return (
    <>
      {/* Organization + WebSite structured data (SEO lane, seo/site/brand-jsonld.tsx). */}
      <BrandJsonLd />
      <LandingPage />
    </>
  );
}
