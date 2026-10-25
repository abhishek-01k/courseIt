"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";

/** Daily learning time, for every course: days are re-packed from it on the next render. */
export async function setDailyMinutesAction(minutesPerDay: number) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  if (!Number.isFinite(minutesPerDay)) return;
  const minutes = Math.round(Math.min(Math.max(minutesPerDay, 5), 480));
  await db.update(users).set({ minutesPerDay: minutes }).where(eq(users.id, userId));
  refresh();
}
