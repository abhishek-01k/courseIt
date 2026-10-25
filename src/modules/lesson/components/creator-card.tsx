import { ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getCreator } from "../queries";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

// Credit where it's due: the creator's photo, name, subscribers, and a link to their channel.
export default async function CreatorCard({ videoId }: { videoId: string }) {
  const creator = await getCreator(videoId);
  if (!creator) return null;
  const url = creator.handle ? `https://www.youtube.com/${creator.handle}` : creator.id ? `https://www.youtube.com/channel/${creator.id}` : null;

  return (
    <div className="flex items-center gap-3 rounded-card bg-surface p-3 pr-4 shadow-[0_0_0_1px_var(--line)]">
      <span className="relative size-11 shrink-0 overflow-hidden rounded-full bg-lime-soft">
        {creator.avatarUrl && (
          // A 44px photo from YouTube's image host, which refuses requests that carry another site as referrer.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={creator.avatarUrl} alt="" width={44} height={44} referrerPolicy="no-referrer" className="size-full object-cover" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{creator.title}</p>
        <p className="text-[0.82rem] text-ink-soft">
          {creator.subscribers != null ? `${compact.format(creator.subscribers)} subscribers` : "Creator of this course"}
        </p>
      </div>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Open YouTube
          <ExternalLink aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
    </div>
  );
}

export function CreatorCardFallback({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-3 rounded-card bg-surface p-3 pr-4 shadow-[0_0_0_1px_var(--line)]">
      <span className="size-11 shrink-0 rounded-full bg-lime-soft" />
      <p className="truncate font-semibold">{name}</p>
    </div>
  );
}
