// One-time: gives topics and a language to courses built before tagging existed (new builds tag themselves).
// Only touches courses with no tags, so it's safe to run again. Uses the database in DATABASE_URL.
//   pnpm dlx tsx --env-file=.env.local scripts/tag-courses.ts [how many]
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { tagCourse } from "@/lib/course-tagger";

async function main() {
  const limit = Number(process.argv[2]) || 100_000;
  const todo = await db
    .select({ id: courses.id, title: courses.title })
    .from(courses)
    .where(and(ne(courses.status, "failed"), eq(sql`cardinality(${courses.tags})`, 0)))
    .limit(limit);
  console.log(`${todo.length} courses to tag`);

  let failed = 0;
  const tokens = { input: 0, output: 0 };
  const queue = [...todo];
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      for (let next = queue.shift(); next; next = queue.shift()) {
        try {
          const saved = await tagCourse(next.id);
          tokens.input += saved?.usage.input ?? 0;
          tokens.output += saved?.usage.output ?? 0;
          console.log(`${saved?.tags.join(",")} [${saved?.language}]  ${next.title.slice(0, 70)}`);
        } catch (error) {
          failed++;
          console.error(`FAILED ${next.title.slice(0, 70)}: ${error}`);
        }
      }
    }),
  );
  console.log(`Done. ${todo.length - failed} tagged, ${failed} failed. Tokens: ${tokens.input} in, ${tokens.output} out.`);
  process.exit(failed ? 1 : 0);
}

main();
