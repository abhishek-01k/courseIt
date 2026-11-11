import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { CARD_METRICS, type CardMetric, getTotals, roundDown } from "@/modules/admin/stats-queries";

const INK = "#0f1611";
const LIME = "#b8c460";
const PAPER = "#f6f8ec";
const CARD = "#1b211a";
const SIZES = { portrait: [1080, 1350], square: [1080, 1080], story: [1080, 1920], wide: [1200, 675] } as const;

// Admin → Stats → Share cards: since-launch totals as a PNG. Built-in font (see the course opengraph-image).
export async function GET(request: NextRequest) {
  if (!(await isAdminRequest())) return new Response("Not found", { status: 404 });
  const sp = request.nextUrl.searchParams;
  const keys = (sp.get("m") ?? "learners,hours,lessons,courses")
    .split(",")
    .filter((k): k is CardMetric => k in CARD_METRICS)
    .filter((k, i, all) => all.indexOf(k) === i)
    .slice(0, 6);
  const sizeKey = (sp.get("size") ?? "portrait") as keyof typeof SIZES;
  const [width, height] = SIZES[sizeKey] ?? SIZES.portrait;
  const round = sp.get("round") === "1";
  const title = (sp.get("title") ?? "").trim().slice(0, 60);
  const t = await getTotals();
  const items = keys.map((k) => {
    const v = CARD_METRICS[k].value(t);
    return { label: CARD_METRICS[k].label, value: round ? roundDown(v) : v.toLocaleString("en") };
  });
  const wide = width > height;
  const cols = wide ? Math.min(3, items.length) : items.length > 3 ? 2 : 1;
  const big = wide ? 76 : cols === 1 ? 120 : 96;
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: INK, color: PAPER, padding: wide ? "48px 60px" : "84px 72px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: wide ? 40 : 52, fontWeight: 700, color: LIME }}>CourseIt</div>
          <div style={{ display: "flex", fontSize: wide ? 22 : 28, opacity: 0.6 }}>{date}</div>
        </div>
        <div style={{ display: "flex", marginTop: wide ? 18 : 40, fontSize: wide ? 44 : 64, lineHeight: 1.1, maxWidth: "95%" }}>{title || "Learners so far"}</div>
        <div style={{ display: "flex", flexWrap: "wrap", flex: 1, alignContent: "center", gap: wide ? 20 : 28, marginTop: wide ? 20 : 32 }}>
          {items.map((it) => (
            <div
              key={it.label}
              style={{
                display: "flex",
                flexDirection: "column",
                width: `${Math.floor(100 / cols) - (cols > 1 ? 2 : 0)}%`,
                background: CARD,
                borderLeft: `8px solid ${LIME}`,
                borderRadius: 20,
                padding: wide ? "20px 26px" : "30px 36px",
              }}
            >
              <div style={{ display: "flex", fontSize: big, fontWeight: 700, lineHeight: 1, color: LIME }}>{it.value}</div>
              <div style={{ display: "flex", fontSize: wide ? 26 : 36, marginTop: 10, opacity: 0.85 }}>{it.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: wide ? 22 : 30, opacity: 0.7 }}>
          <span>Any YouTube video, turned into a course</span>
          <span style={{ color: LIME }}>courseit.xyz</span>
        </div>
      </div>
    ),
    {
      width,
      height,
      headers: {
        "Cache-Control": "private, no-store",
        ...(sp.get("download") === "1" && { "Content-Disposition": `attachment; filename="courseit-stats-${sizeKey}.png"` }),
      },
    },
  );
}
