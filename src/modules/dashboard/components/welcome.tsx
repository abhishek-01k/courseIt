import { redirect } from "next/navigation";
import Pill from "@/components/pill";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { signOutAction } from "../actions";

export default async function Welcome() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="flex flex-col items-start gap-5">
      <Pill>Signed in{session.user.email ? ` as ${session.user.email}` : ""}</Pill>
      <h1 className="text-h1">
        Welcome, {firstName}. <em className="italic text-moss">Let&apos;s keep going.</em>
      </h1>
      <p className="max-w-[520px] text-ink-soft">Your courses, streak and plan will show up here.</p>
      <form action={signOutAction}>
        <button type="submit" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Sign out
        </button>
      </form>
    </div>
  );
}
