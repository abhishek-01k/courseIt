import type { NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { csvResponse, toCsv } from "@/modules/admin/csv";
import { parseFilter } from "@/modules/admin/learner-filter";
import { exportAdminUsers, USER_SORTS, type UserSort } from "@/modules/admin/queries";

// Admin → Learners → Export CSV: every learner matching the filters on screen, in the same order.
export async function GET(request: NextRequest) {
  if (!(await isAdminRequest())) return new Response("Not found", { status: 404 });
  const sp = Object.fromEntries(request.nextUrl.searchParams);
  const sort = (sp.sort in USER_SORTS ? sp.sort : "active") as UserSort;
  const list = await exportAdminUsers(parseFilter(sp), sort);
  const csv = toCsv(
    ["name", "email", "plan", "paid", "signed_up", "first_seen", "last_seen", "active_days", "streak", "best_streak", "courses_taking", "courses_built", "lessons", "hours_watched", "quiz_answers", "quiz_accuracy"],
    list.map((u) => [u.name, u.email, u.plan, u.paid ? "yes" : "no", u.joined, u.firstSeen, u.lastSeen, u.days, u.streak, u.best, u.enrolled, u.built, u.lessons, (u.watched / 3600).toFixed(2), u.answers, u.accuracy == null ? "" : u.accuracy.toFixed(3)]),
  );
  return csvResponse(csv, `courseit-learners-${new Date().toISOString().slice(0, 10)}.csv`);
}

