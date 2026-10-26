import { GoogleGenAI } from "@google/genai";
import { AI } from "@/lib/constants";

const clock = (s: number) =>
  [Math.floor(s / 3600), Math.floor((s % 3600) / 60), Math.floor(s % 60)].map((n) => String(n).padStart(2, "0")).join(":");

/**
 * Gemini watches one stretch of a public YouTube video and writes timestamped study notes.
 * Reading YouTube links directly keeps us inside YouTube's terms (no downloading or scraping).
 */
export async function readVideoSegment(video: { id: string; title: string }, start: number, end: number) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const interaction = await ai.interactions.create({
    model: AI.readerModel,
    input: [
      {
        type: "video",
        uri: `https://www.youtube.com/watch?v=${video.id}`,
        processing: { type: "static", fps: AI.readerFps, start_offset: `${start}s`, end_offset: `${end}s` },
        resolution: "low",
      },
      {
        type: "text",
        text: `This is ${clock(start)}–${clock(end)} of the educational video "${video.title}".
Write detailed study notes of everything taught in this part, in order.
Rules:
- One line per idea: "[HH:MM:SS] what is explained", using the time in the FULL video (this part starts at ${clock(start)}).
- Include definitions, formulas, code and diagrams shown on screen, and worked examples, in enough detail to write quiz questions from.
- Skip intros, sponsor segments, channel promotion and small talk.
- Plain text only.`,
      },
    ],
  });
  const notes = interaction.output_text?.trim();
  if (!notes) throw new Error(`Gemini returned no notes for ${video.id} ${start}-${end}`);
  return notes;
}

export type Nemotron = keyof typeof AI.nemotron;

// Overloaded (529), rate limited (429), server errors and timeouts are worth waiting out.
const BUSY = new Set([429, 500, 502, 503, 504, 529]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class Busy extends Error {}
class TimedOut extends Busy {}

/** A JSON Schema the answer must match. Token Factory enforces it while the model writes (strict json_schema). */
export type Schema = Record<string, unknown>;

async function callNemotron(model: Nemotron, system: string, user: string, schema: Schema, think: boolean, maxTokens: number, timeoutMs: number) {
  let res: Response;
  try {
    res = await fetch("https://api.tokenfactory.nebius.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.NEBIUS_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: AI.nemotron[model],
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        // json_object only promises JSON; a strict schema also fixes its shape (seen: options sent as one string).
        response_format: { type: "json_schema", json_schema: { name: "answer", strict: true, schema } },
        temperature: 0.3,
        max_tokens: maxTokens, // includes the thinking tokens
        ...(!think && { chat_template_kwargs: { enable_thinking: false } }),
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    throw new TimedOut(`${AI.modelNames[model]} timed out: ${(error as Error).message}`);
  }
  if (BUSY.has(res.status)) throw new Busy(`${AI.modelNames[model]} busy (${res.status})`);
  if (!res.ok) throw new Error(`Nebius ${res.status}: ${(await res.text()).slice(0, 300)}`);

  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";
  // Thinking arrives separately (reasoning_content); still strip <think> in case a model inlines it.
  const json = text.replace(/<think>[\s\S]*?<\/think>/g, "");
  const from = json.indexOf("{");
  const to = json.lastIndexOf("}");
  if (from < 0 || to < from) throw new Error(`Nemotron returned no JSON: ${text.slice(0, 200)}`);
  return JSON.parse(json.slice(from, to + 1)) as unknown;
}

/**
 * Nemotron on Nebius Token Factory (OpenAI-compatible). When Nebius is busy it waits and retries
 * (2s, 6s), then moves to the next model in AI.fallbacks, so a learner gets a lesson instead of an
 * error. Returns the parsed JSON and the model that answered. Other errors throw so the job step retries.
 */
export async function nemotronJson(
  model: Nemotron,
  system: string,
  user: string,
  schema: Schema,
  { think = true, maxTokens = 16000 }: { think?: boolean; maxTokens?: number } = {},
): Promise<{ json: unknown; model: Nemotron }> {
  let last: Error = new Error("No model answered");
  // Stay inside one serverless invocation (300s): the job step retries anything past that anyway.
  const deadline = Date.now() + 250_000;
  for (const candidate of [model, ...AI.fallbacks[model]]) {
    for (const wait of [0, 2000, 6000]) {
      const left = deadline - Date.now() - wait;
      if (left < 20_000) throw last;
      await sleep(wait);
      try {
        return { json: await callNemotron(candidate, system, user, schema, think, maxTokens, Math.min(120_000, left)), model: candidate };
      } catch (error) {
        if (!(error instanceof Busy)) throw error;
        last = error;
        if (error instanceof TimedOut) break; // a slow model won't get faster: try the next one
      }
    }
  }
  throw last;
}
