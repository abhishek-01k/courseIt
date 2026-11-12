// Creators whose videos are already public courses on CourseIt, with how many learners study them and the contact
// email in their channel description when they wrote one. Writes outreach/courseit-creators.csv.
//   node --env-file=.env.local scripts/outreach/courseit-creators.mjs [--min 0] [--max 500000] [--top 300]
import { neon } from "@neondatabase/serverless";
import { args, channelDetails, mergeInto, report } from "./lib.mjs";

const a = args();
const min = Number(a.min ?? 0);
const max = Number(a.max ?? 500_000);
const out = a.out ?? "outreach/courseit-creators.csv";
const app = (process.env.APP_URL ?? "https://www.courseit.xyz").replace(/\/$/, "");

// Videos fetched before channel ids were saved have none, so their creators are missing until someone opens the course.
const found = await neon(process.env.DATABASE_URL).query(
  `with cc as (
     select distinct c.id, c.title, c.slug, v.channel_id
     from course c join course_video cv on cv.course_id = c.id join video v on v.id = cv.video_id
     where not c.is_private and c.status = 'ready' and v.channel_id is not null),
   l as (select cc.*, (select count(distinct e.user_id) from enrollment e where e.course_id = cc.id)::int as learners from cc)
   select channel_id, count(*)::int as courses, max(learners)::int as learners,
          (array_agg(title order by learners desc))[1] as top_course, (array_agg(slug order by learners desc))[1] as top_slug
   from l group by channel_id having max(learners) > 0 order by learners desc limit $1`,
  [Number(a.top ?? 300)],
);

const stats = new Map(found.map((r) => [r.channel_id, r]));
const fit = (await channelDetails([...stats.keys()]))
  .filter((c) => c.subscribers === "" || (c.subscribers >= min && c.subscribers <= max))
  .map((c) => {
    const s = stats.get(c.channel_id);
    // learners: on their most studied course, so the email can say "N people have studied <course>" and be exactly true.
    return { ...c, source: "courseit", courses: s.courses, learners: s.learners, top_course: s.top_course, top_course_url: `${app}/courses/${s.top_slug}` };
  })
  .sort((x, y) => y.learners - x.learners);

const { rows, added } = mergeInto(out, fit);
report(out, rows, added);
