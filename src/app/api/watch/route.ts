import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { lessons, lessonWatch } from "@/db/schema";
import { auth } from "@/lib/auth";

// A route (not a server action) so the player can send with `keepalive` while the tab is closing.
// Body: { lessonId, seconds: number[] } — newly seen seconds, as offsets from the lesson's start.
// They're merged with every earlier session, so half today and half tomorrow add up to the whole lesson.
export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return Response.json({ error: "Sign in first" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { lessonId?: unknown; seconds?: unknown } | null;
  if (typeof body?.lessonId !== "string" || !Array.isArray(body.seconds) || body.seconds.length > 4000) {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  const [lesson] = await db
    .select({ courseId: lessons.courseId, length: sql<number>`${lessons.endSeconds} - ${lessons.startSeconds}` })
    .from(lessons)
    .where(eq(lessons.id, body.lessonId));
  if (!lesson) return Response.json({ error: "No such lesson" }, { status: 404 });

  const fresh = body.seconds.filter((s): s is number => Number.isInteger(s) && s >= 0 && s < lesson.length);
  const where = and(eq(lessonWatch.userId, userId), eq(lessonWatch.lessonId, body.lessonId));
  const [row] = await db.select({ seconds: lessonWatch.seconds, watchedAt: lessonWatch.watchedAt }).from(lessonWatch).where(where);
  const seconds = [...new Set([...(row?.seconds ?? []), ...fresh])].sort((a, b) => a - b);
  const watchedAt = row?.watchedAt ?? (seconds.length >= 0.8 * lesson.length ? new Date() : null);

  await db
    .insert(lessonWatch)
    .values({ userId, lessonId: body.lessonId, courseId: lesson.courseId, seconds, watchedSeconds: seconds.length, watchedAt })
    .onConflictDoUpdate({
      target: [lessonWatch.userId, lessonWatch.lessonId],
      set: { seconds, watchedSeconds: seconds.length, watchedAt, updatedAt: new Date() },
    });
  return Response.json({ watchedSeconds: seconds.length, watched: Boolean(watchedAt) });
}
