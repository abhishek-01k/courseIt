import Hero from "./components/hero";
import CallToAction from "./components/call-to-action";
import FeaturesBento from "./components/features-bento";
import HowItWorks from "./components/how-it-works";
import PopularCourses from "./components/popular-courses";
import ProductPreview from "./components/product-preview";
import Testimonials from "./components/testimonials";
import TrustedBy from "./components/trusted-by";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <ProductPreview />
      <FeaturesBento />
      <PopularCourses />
      <HowItWorks />
      <TrustedBy />
      <Testimonials />
      <CallToAction />
    </>
  );
}
