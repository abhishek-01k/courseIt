"use server";

import { and, asc, count, eq, max } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { courses, roadmapCourses, roadmapFollows, roadmaps, roadmapStages } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { newSlug, roadmapPath } from "@/lib/paths";
import { startCourse } from "@/modules/course/start";

export type RoadmapFormState = { error?: string; ok?: boolean };

async function me() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  return userId;
}

/** The roadmap, only if this learner owns it. Every change goes through here. */
async function owned(userId: string, roadmapId: string) {
  const [row] = await db.select({ id: roadmaps.id, slug: roadmaps.slug }).from(roadmaps).where(and(eq(roadmaps.id, roadmapId), eq(roadmaps.ownerId, userId)));
  return row ?? null;
}

async function ownedStage(userId: string, stageId: string) {
  const [row] = await db
    .select({ id: roadmapStages.id, roadmapId: roadmaps.id })
    .from(roadmapStages)
    .innerJoin(roadmaps, eq(roadmaps.id, roadmapStages.roadmapId))
    .where(and(eq(roadmapStages.id, stageId), eq(roadmaps.ownerId, userId)));
  return row ?? null;
}

const touch = (roadmapId: string) => db.update(roadmaps).set({ updatedAt: new Date() }).where(eq(roadmaps.id, roadmapId));
const clean = (value: FormDataEntryValue | null, maxLength: number) => String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maxLength);
const NOT_YOURS = { error: "You can only edit your own roadmaps." };

export async function createRoadmapAction(_prev: RoadmapFormState, formData: FormData): Promise<RoadmapFormState> {
  const userId = await me();
  const title = clean(formData.get("title"), 80);
  if (title.length < 3) return { error: "Give your roadmap a name, like “Become an AI Engineer”." };
  const id = crypto.randomUUID();
  const slug = newSlug(title);
  // Starts with one stage so a link can be pasted right away.
  await db.batch([db.insert(roadmaps).values({ id, slug, ownerId: userId, title }), db.insert(roadmapStages).values({ roadmapId: id, position: 0, name: "Stage 1" })]);
  redirect(roadmapPath(slug));
}

export async function updateRoadmapAction(roadmapId: string, _prev: RoadmapFormState, formData: FormData): Promise<RoadmapFormState> {
  const userId = await me();
  if (!(await owned(userId, roadmapId))) return NOT_YOURS;
  const title = clean(formData.get("title"), 80);
  if (title.length < 3) return { error: "The name needs at least 3 characters." };
  const description = String(formData.get("description") ?? "").trim().slice(0, 400);
  await db.update(roadmaps).set({ title, description, updatedAt: new Date() }).where(eq(roadmaps.id, roadmapId));
  refresh();
  return { ok: true };
}

/** Community roadmaps are made by admins: an admin publishes (or takes down) one of their own roadmaps. */
export async function setPublishedAction(roadmapId: string, published: boolean): Promise<RoadmapFormState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  if (!isAdmin(session.user?.email)) return { error: "Only admins can publish roadmaps to Community." };
  if (!(await owned(userId, roadmapId))) return NOT_YOURS;
  await db.update(roadmaps).set({ published, updatedAt: new Date() }).where(eq(roadmaps.id, roadmapId));
  refresh();
  return { ok: true };
}

export async function deleteRoadmapAction(roadmapId: string): Promise<RoadmapFormState> {
  const userId = await me();
  if (!(await owned(userId, roadmapId))) return NOT_YOURS;
  // Learners enrolled in it study the creator's roadmap itself, so it stays while anyone is enrolled.
  const [{ enrolled }] = await db.select({ enrolled: count() }).from(roadmapFollows).where(eq(roadmapFollows.roadmapId, roadmapId));
  if (enrolled) return { error: `${enrolled} ${enrolled === 1 ? "learner is" : "learners are"} enrolled in this roadmap, so it can't be deleted.` };
  await db.delete(roadmaps).where(eq(roadmaps.id, roadmapId)); // stages and their course links cascade; courses stay
  redirect("/roadmaps");
}

export async function addStageAction(roadmapId: string, _prev: RoadmapFormState, formData: FormData): Promise<RoadmapFormState> {
  const userId = await me();
  if (!(await owned(userId, roadmapId))) return NOT_YOURS;
  const name = clean(formData.get("name"), 60);
  if (!name) return { error: "Name the stage, like “Python” or “Math for ML”." };
  const [{ last }] = await db.select({ last: max(roadmapStages.position) }).from(roadmapStages).where(eq(roadmapStages.roadmapId, roadmapId));
  await db.batch([db.insert(roadmapStages).values({ roadmapId, name, position: (last ?? -1) + 1 }), touch(roadmapId)]);
  refresh();
  return { ok: true };
}

export async function renameStageAction(stageId: string, _prev: RoadmapFormState, formData: FormData): Promise<RoadmapFormState> {
  const userId = await me();
  const stage = await ownedStage(userId, stageId);
  if (!stage) return NOT_YOURS;
  const name = clean(formData.get("name"), 60);
  if (!name) return { error: "A stage needs a name." };
  await db.batch([db.update(roadmapStages).set({ name }).where(eq(roadmapStages.id, stageId)), touch(stage.roadmapId)]);
  refresh();
  return { ok: true };
}

export async function removeStageAction(stageId: string) {
  const userId = await me();
  const stage = await ownedStage(userId, stageId);
  if (!stage) return NOT_YOURS;
  await db.batch([db.delete(roadmapStages).where(eq(roadmapStages.id, stageId)), touch(stage.roadmapId)]); // its course links cascade
  refresh();
}

/** Swaps a stage with the one above or below it. */
export async function moveStageAction(stageId: string, direction: "up" | "down") {
  const userId = await me();
  const stage = await ownedStage(userId, stageId);
  if (!stage) return NOT_YOURS;
  const stages = await db.select({ id: roadmapStages.id, position: roadmapStages.position }).from(roadmapStages).where(eq(roadmapStages.roadmapId, stage.roadmapId)).orderBy(asc(roadmapStages.position));
  const i = stages.findIndex((s) => s.id === stageId);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= stages.length) return;
  // Renumber 0..n so gaps left by removed stages never make a swap a no-op.
  const order = stages.map((s) => s.id);
  [order[i], order[j]] = [order[j], order[i]];
  await db.batch([touch(stage.roadmapId), ...order.map((id, position) => db.update(roadmapStages).set({ position }).where(eq(roadmapStages.id, id)))]);
  refresh();
}

/**
 * Enroll in a roadmap someone shared (or one from Community): the creator's roadmap itself joins your
 * Roadmaps under "Enrolled", read-only and in sync with their changes. Enrollments live in roadmap_follow.
 */
export async function enrollRoadmapAction(roadmapId: string, enroll: boolean) {
  const userId = await me();
  const [roadmap] = await db.select({ ownerId: roadmaps.ownerId }).from(roadmaps).where(eq(roadmaps.id, roadmapId));
  if (!roadmap) return { error: "That roadmap was deleted." };
  if (roadmap.ownerId === userId) return;
  if (enroll) {
    await db.insert(roadmapFollows).values({ userId, roadmapId }).onConflictDoNothing();
  } else {
    await db.delete(roadmapFollows).where(and(eq(roadmapFollows.userId, userId), eq(roadmapFollows.roadmapId, roadmapId)));
  }
  refresh();
}

/** Puts a course in a stage; if the roadmap already has it in another stage, it moves there. */
async function place(roadmapId: string, stageId: string, courseId: string) {
  const [{ last }] = await db.select({ last: max(roadmapCourses.position) }).from(roadmapCourses).where(eq(roadmapCourses.stageId, stageId));
  const position = (last ?? -1) + 1;
  await db.batch([
    db
      .insert(roadmapCourses)
      .values({ roadmapId, stageId, courseId, position })
      .onConflictDoUpdate({ target: [roadmapCourses.roadmapId, roadmapCourses.courseId], set: { stageId, position } }),
    touch(roadmapId),
  ]);
}

/** "Paste a YouTube link" in a stage: joins an existing course or starts building a new one, like New course. */
export async function addCourseLinkAction(stageId: string, _prev: RoadmapFormState, formData: FormData): Promise<RoadmapFormState> {
  const userId = await me();
  const stage = await ownedStage(userId, stageId);
  if (!stage) return NOT_YOURS;
  const result = await startCourse(userId, String(formData.get("url") ?? ""));
  if ("error" in result) return result;
  await place(stage.roadmapId, stageId, result.course.id);
  refresh();
  return { ok: true };
}

/** "Add to a roadmap" from a course page. */
export async function addCourseToStageAction(stageId: string, courseId: string) {
  const userId = await me();
  const stage = await ownedStage(userId, stageId);
  const [course] = await db.select({ id: courses.id }).from(courses).where(eq(courses.id, courseId));
  if (!stage) return NOT_YOURS;
  if (!course) return { error: "That course no longer exists." };
  await place(stage.roadmapId, stageId, course.id);
  refresh();
}

export async function removeCourseAction(roadmapId: string, courseId: string) {
  const userId = await me();
  if (!(await owned(userId, roadmapId))) return NOT_YOURS;
  await db.batch([db.delete(roadmapCourses).where(and(eq(roadmapCourses.roadmapId, roadmapId), eq(roadmapCourses.courseId, courseId))), touch(roadmapId)]);
  refresh();
}
