import { buttonVariants } from "@/components/ui/button";
import { AUTH_PROVIDERS } from "@/lib/constants";
import { signInWith } from "../actions";

export default function ProviderButtons({ next }: { next?: string }) {
  return (
    <div className="flex w-full flex-col gap-2.5">
      {AUTH_PROVIDERS.map((provider) => (
        <form key={provider.id} action={signInWith.bind(null, provider.id, next)}>
          <button type="submit" className={buttonVariants({ variant: "outline", size: "lg", className: "w-full bg-surface cursor-pointer" })}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px] fill-current">
              <path d={provider.iconPath} />
            </svg>
            {provider.label}
          </button>
        </form>
      ))}
    </div>
  );
}
