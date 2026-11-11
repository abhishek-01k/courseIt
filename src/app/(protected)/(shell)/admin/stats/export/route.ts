import { isAdminRequest } from "@/lib/admin";
import { csvResponse, toCsv } from "@/modules/admin/csv";
import { dailySeries, getTotals } from "@/modules/admin/stats-queries";

// Admin → Stats → Daily numbers: one row per UTC day since the first visit, for investor sheets and grant forms.
export async function GET() {
  if (!(await isAdminRequest())) return new Response("Not found", { status: 404 });
  const { firstDay } = await getTotals();
  const days = firstDay ? await dailySeries(firstDay) : [];
  const csv = toCsv(
    ["day", "new_learners", "active_learners", "total_learners", "quiz_answers", "lessons_completed", "courses_built", "enrollments"],
    days.map((d) => [d.day, d.signups, d.active, d.total, d.answers, d.completed, d.courses, d.enrollments]),
  );
  return csvResponse(csv, `courseit-daily-${new Date().toISOString().slice(0, 10)}.csv`);
}
