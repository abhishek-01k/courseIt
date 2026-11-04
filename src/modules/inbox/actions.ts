"use server";

import { and, eq, isNull } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { auth } from "@/lib/auth";

/** Opening the Inbox marks everything in it as read, and the sidebar's unread count goes away. */
export async function markInboxReadAction() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;
  const updated = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .returning({ id: notifications.id });
  if (updated.length) refresh();
}
