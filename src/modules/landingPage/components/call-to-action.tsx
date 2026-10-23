import CtaButtons from "./cta-buttons";

export default function CallToAction() {
  return (
    <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center">
      <h2 className="text-4xl font-semibold leading-none tracking-tighter text-balance sm:text-6xl">
        Your next course, <em className="font-serif font-normal italic text-primary">finished</em>.
      </h2>
      <p className="mt-5 mb-10 text-lg text-muted-foreground">Any YouTube video or playlist. Free while in beta.</p>
      <CtaButtons />
    </section>
  );
}
