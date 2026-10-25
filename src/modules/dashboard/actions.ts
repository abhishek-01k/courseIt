"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userDays, users } from "@/db/schema";
import { auth, signOut } from "@/lib/auth";

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

/** Marks today as a learning day in the learner's timezone. Opening CourseIt is what keeps the streak. */
export async function recordVisitAction(timezone: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;
  let zone = "UTC";
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
    zone = timezone;
  } catch {}
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: zone }).format(new Date()); // YYYY-MM-DD
  await db.batch([db.insert(userDays).values({ userId, day }).onConflictDoNothing(), db.update(users).set({ timezone: zone }).where(eq(users.id, userId))]);
}
