import { ImageResponse } from "next/og";
import { formatDuration, plural } from "@/lib/utils";
import { getCoursePreview } from "@/modules/course/queries";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A free YouTube video split into lessons with quizzes and a day-by-day plan on CourseIt";

const INK = "#0f1611";
const CARD = "#1b211a";
const AFTER = "#26320f";
const ROW = "#1a230b";
const LIME = "#b8c460";
const PAPER = "#f6f8ec";

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const clock = (s: number) => `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// Before (the YouTube video) and after (the same video as lessons on CourseIt). The red progress bar and the
// "known" first lesson are illustrations; every number and title comes from the course.
// ponytail: next/og's built-in font, not Familjen Grotesk; load the TTF here if the brand font matters.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const c = await getCoursePreview((await params).slug);
  if (!c) {
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: INK, color: LIME, fontSize: 72 }}>CourseIt</div>,
      size,
    );
  }
  const what = c.videoCount > 1 ? "playlist" : "video";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: INK, color: PAPER, padding: "40px 52px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", fontSize: 40, lineHeight: 1.15 }}>
          <span>{clip(`${c.channel}'s free ${formatDuration(c.seconds)} ${what},`, 48)}&nbsp;</span>
          <span style={{ color: LIME }}>split into a course you&apos;ll actually finish</span>
        </div>

        <div style={{ display: "flex", flex: 1, marginTop: 26 }}>
          <div style={{ display: "flex", flexDirection: "column", width: 470, background: CARD, borderRadius: 20, padding: 22 }}>
            <div style={{ display: "flex", fontSize: 15, letterSpacing: 3, opacity: 0.55 }}>ON YOUTUBE</div>
            <div style={{ display: "flex", position: "relative", marginTop: 14, width: 426, height: 236, borderRadius: 12, overflow: "hidden", background: "#000" }}>
              {c.thumbnail && <img src={c.thumbnail} width={426} height={236} style={{ objectFit: "cover" }} alt="" />}
              <div style={{ display: "flex", position: "absolute", right: 10, bottom: 16, background: "rgba(0,0,0,0.8)", fontSize: 17, padding: "3px 8px", borderRadius: 5 }}>
                {c.videoCount > 1 ? plural(c.videoCount, "video") : clock(c.seconds)}
              </div>
              <div style={{ display: "flex", position: "absolute", left: 0, right: 0, bottom: 0, height: 7, background: "rgba(255,255,255,0.25)" }}>
                <div style={{ display: "flex", width: "9%", height: "100%", background: "#e5372f" }} />
              </div>
            </div>
            <div style={{ display: "flex", marginTop: 14, fontSize: 20, opacity: 0.6 }}>
              {c.videoCount > 1 ? "Video after video. Easy to quit by the third." : "One long video. Easy to quit at minute 40."}
            </div>
          </div>

          <div style={{ display: "flex", width: 64, alignItems: "center", justifyContent: "center", fontSize: 44, color: LIME }}>→</div>

          <div style={{ display: "flex", flexDirection: "column", flex: 1, background: AFTER, border: `3px solid ${LIME}`, borderRadius: 20, padding: 20 }}>
            <div style={{ display: "flex", fontSize: 15, letterSpacing: 3, color: LIME }}>SAME {what.toUpperCase()}, ON COURSEIT</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
              {c.firstLessons.map((l, i) => {
                const known = i === 0 && c.placementTest && c.lessons > 1;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", background: ROW, borderRadius: 10, padding: "6px 10px", opacity: known ? 0.4 : 1 }}>
                    {l.thumbnail && <img src={l.thumbnail} width={72} height={40} style={{ objectFit: "cover", borderRadius: 5, marginRight: 12 }} alt="" />}
                    <span style={{ display: "flex", flex: 1, fontSize: 18, textDecoration: known ? "line-through" : "none" }}>{clip(`${i + 1} · ${l.title}`, 34)}</span>
                    <span style={{ display: "flex", fontSize: 14, color: LIME, border: `1.5px solid ${LIME}`, borderRadius: 99, padding: "2px 9px" }}>
                      {known ? "known" : c.quizzes ? "quiz" : "notes"}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", marginTop: "auto", fontSize: 22 }}>
              {plural(c.lessons, "lesson")} ·&nbsp;<span style={{ color: LIME }}>{plural(c.days, "day")}</span>&nbsp;at {c.minutesPerDay} min{c.quizzes ? " · quiz in each" : ""}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, fontSize: 17, opacity: 0.6 }}>
          <span>{clip(`Free · plays in YouTube's player, so ${c.channel} keeps the views`, 80)}</span>
          <span>courseit.xyz</span>
        </div>
      </div>
    ),
    size,
  );
}
