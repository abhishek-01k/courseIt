import type { MetadataRoute } from "next";
import { and, count, desc, eq } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { db } from "@/db";
import { courses, enrollments } from "@/db/schema";
import { coursePath } from "@/lib/paths";
import { COURSE_SITEMAP_LIMIT, SITE_URL, STATIC_PAGES } from "../config";

/** The current batch of course pages: ready, public, most-joined first. */
async function topCourses() {
  "use cache";
  cacheLife("hours");
  if (COURSE_SITEMAP_LIMIT <= 0) return [];
  return db
    .select({ slug: courses.slug, createdAt: courses.createdAt, learners: count(enrollments.userId) })
    .from(courses)
    .leftJoin(enrollments, eq(enrollments.courseId, courses.id))
    .where(and(eq(courses.status, "ready"), eq(courses.isPrivate, false)))
    .groupBy(courses.id)
    .orderBy(desc(count(enrollments.userId)), desc(courses.createdAt))
    .limit(COURSE_SITEMAP_LIMIT);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // No lastModified on static pages: "dates change only when content changes", and we don't track that per page yet.
  const pages: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({ url: `${SITE_URL}${p.path === "/" ? "" : p.path}`, changeFrequency: p.changeFrequency, priority: p.priority }));
  let courseEntries: MetadataRoute.Sitemap = [];
  try {
    courseEntries = (await topCourses()).map((c) => ({ url: `${SITE_URL}${coursePath(c.slug)}`, lastModified: c.createdAt, changeFrequency: "weekly", priority: 0.6 }));
  } catch (err) {
    // A database hiccup must never take the sitemap down: serve the static pages alone.
    console.error("[seo] sitemap: course query failed", err);
  }
  return [...pages, ...courseEntries];
}
