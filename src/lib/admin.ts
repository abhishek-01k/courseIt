import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";

// ADMIN_EMAILS: comma-separated sign-in emails that can open /admin and publish roadmaps to Community.
const admins = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const isAdmin = (email: string | null | undefined) => Boolean(email && admins().includes(email.toLowerCase()));

/** For admin pages and actions: anyone else gets a plain 404, so the admin area doesn't show it exists. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.email)) notFound();
  return session.user.id;
}
