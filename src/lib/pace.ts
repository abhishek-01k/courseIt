/**
 * Greedy day packing, no AI (from the original CourseIt). Lessons stay in order; a day closes when the
 * next lesson would push it more than 20% over the daily budget. A lesson longer than the budget gets
 * its own day. Returns the day number (1-based) for each lesson.
 */
export function packDays(lessonSeconds: number[], minutesPerDay: number): number[] {
  const limit = minutesPerDay * 60 * 1.2;
  const days: number[] = [];
  let day = 1;
  let used = 0;
  for (const s of lessonSeconds) {
    if (used > 0 && used + s > limit) {
      day++;
      used = 0;
    }
    days.push(day);
    used += s;
  }
  return days;
}
