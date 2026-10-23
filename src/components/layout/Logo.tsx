import Link from "next/link";
import { Play } from "lucide-react";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
      <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background">
        <Play className="size-3 fill-current" />
      </span>
      <span>
        Course<span className="text-primary">It</span>
      </span>
    </Link>
  );
}
