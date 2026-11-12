// The outreach emails. Plain text on purpose: a personal note lands in the inbox, a designed one lands in Promotions.
// Edit the wording here. `c` is a row of the list (channel, name, subscribers, learners, top_course, …); `me` is you.
// Before sending: make sure every promise below is something CourseIt does today.

const hi = (c) => `Hi ${c.name || c.channel},`;
const subs = (c) => (c.subscribers ? `${Math.round(Number(c.subscribers) / 1000)}k` : "");
const people = (n) => (Number(n) === 1 ? "1 person has" : `${n} people have`);
const signoff = (me) => `${me.name}\nCourseIt · ${me.site}\n\nNot for you? Reply "no" and I won't write again.`;

export const TEMPLATES = {
  // Their videos are already a course on CourseIt (list from courseit-creators.mjs).
  courseit: {
    first: (c, me) => ({
      subject: `${people(c.learners)} studied "${c.top_course}" on CourseIt`,
      text: `${hi(c)}

I'm ${me.name}, I run CourseIt. It turns YouTube videos and playlists into structured courses with lessons, quizzes and a study plan.

Learners added your videos, and ${people(c.learners)} studied "${c.top_course}" there so far${Number(c.courses) > 1 ? ` (${c.courses} of your courses are on CourseIt in total)` : ""}:
${c.top_course_url}

The videos play in YouTube's own player, so every view and minute of watch time is yours.

I'd like to make it official and work with you: your own page, and a course your audience can buy from you directly, with us handling the lessons, quizzes and payments. And if you'd rather your videos weren't on CourseIt, tell me and I'll take them down the same day.

Would a 15-minute call this week work?

${signoff(me)}`,
    }),
    followup: (c, me) => ({
      subject: `Re: ${people(c.learners)} studied "${c.top_course}" on CourseIt`,
      text: `${hi(c)}

Following up once in case my note got buried. ${people(c.learners).replace(/^\w/, (l) => l.toUpperCase())} studied "${c.top_course}" on CourseIt, and I'd like to set it up properly with you (or remove it, if you prefer).

Happy to send details by email if a call is too much.

${signoff(me)}`,
    }),
  },

  // Teachers who aren't on CourseIt yet (list from find-creators.mjs).
  cold: {
    first: (c, me) => ({
      subject: `A course from your ${c.channel} videos`,
      text: `${hi(c)}

I'm ${me.name}, I run CourseIt. It turns YouTube videos and playlists into structured courses with lessons, quizzes and a study plan.

You already teach ${subs(c) ? `${subs(c)} people` : "a real audience"} on YouTube. I think your playlists would make a course people would pay for, and I'd like to build it with you: we turn your existing videos into the course and handle the lessons, quizzes and payments, you share it with your audience. No new recording. The videos keep playing in YouTube's player, so views stay yours.

Can I build a sample from one of your playlists and send it over? If you like it, we talk; if not, I delete it.

${signoff(me)}`,
    }),
    followup: (c, me) => ({
      subject: `Re: A course from your ${c.channel} videos`,
      text: `${hi(c)}

Following up once in case my note got buried. I'd still like to build a sample course from one of your playlists, free, for you to look at. Just reply with the playlist you'd pick.

${signoff(me)}`,
    }),
  },
};
