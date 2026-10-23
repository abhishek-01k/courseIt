import Hero from "./components/hero";
import CallToAction from "./components/call-to-action";
import FeaturesBento from "./components/features-bento";
import ProductPreview from "./components/product-preview";
import Testimonials from "./components/testimonials";
import UnderTheHood from "./components/under-the-hood";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <ProductPreview />
      <FeaturesBento />
      <UnderTheHood />
      <Testimonials />
      <CallToAction />
    </>
  );
}
