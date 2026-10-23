import { Reveal } from "@/components/motion/reveal";
import Pill from "./pill";

type SectionHeadingProps = {
  id: string;
  label: string;
  title: string;
  accent: string;
};

// Pill + h2 ending in the italic moss phrase (once per section).
export default function SectionHeading({ id, label, title, accent }: SectionHeadingProps) {
  return (
    <Reveal className="flex flex-col items-center gap-[18px] text-center">
      <Pill>{label}</Pill>
      <h2 id={id} className="text-h2">
        {title} <em className="italic text-moss">{accent}</em>
      </h2>
    </Reveal>
  );
}
