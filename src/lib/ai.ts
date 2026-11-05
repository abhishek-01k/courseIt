import { AI } from "@/lib/constants";

export type Nemotron = keyof typeof AI.nemotron;
/** Tokens one answer used, as Nebius reports them (output includes any thinking). */
export type Usage = { input: number; output: number };

// Overloaded (529), rate limited (429), server errors and timeouts are worth waiting out.
const BUSY = new Set([429, 500, 502, 503, 504, 529]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class Busy extends Error {}
class TimedOut extends Busy {}

/** A JSON Schema the answer must match. Token Factory enforces it while the model writes (strict json_schema). */
export type Schema = Record<string, unknown>;

async function callNemotron(model: Nemotron, system: string, user: string, schema: Schema, think: boolean, maxTokens: number, timeoutMs: number, strict: boolean) {
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
        // Strict: Nebius enforces the schema while the model writes, but it also strips line breaks inside strings
        // (proved Nov 2026: 0 newlines in every lesson), which flattens markdown. Text with markdown uses plain JSON
        // mode and relies on our own checks of the answer instead.
        response_format: strict ? { type: "json_schema", json_schema: { name: "answer", strict: true, schema } } : { type: "json_object" },
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
  // Why the model stopped and how much it wrote, so a bad answer's cause and cost show up in the fallback log.
  const ended = `finish=${data.choices?.[0]?.finish_reason ?? "?"}, ${data.usage?.completion_tokens ?? "?"} output tokens`;
  // Thinking arrives separately (reasoning_content); still strip <think> in case a model inlines it.
  const json = text.replace(/<think>[\s\S]*?<\/think>/g, "");
  const from = json.indexOf("{");
  const to = json.lastIndexOf("}");
  // A cut-off or garbled answer is worth another try, and then the backup model, just like a busy one.
  if (from < 0 || to < from) throw new Busy(`${AI.modelNames[model]} returned no JSON (${ended}): ${text.slice(0, 120)}`);
  // Nebius reports the tokens each answer used; kept so real cost per lesson can be measured (lesson-speed.check.ts).
  const usage: Usage = { input: data.usage?.prompt_tokens ?? 0, output: data.usage?.completion_tokens ?? 0 };
  try {
    return { json: JSON.parse(json.slice(from, to + 1)) as unknown, usage };
  } catch (error) {
    throw new Busy(`${AI.modelNames[model]} returned broken JSON (${ended}): ${(error as Error).message}`);
  }
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
  { think = true, maxTokens = 16000, fallbacks = AI.fallbacks[model], strict = true }: { think?: boolean; maxTokens?: number; fallbacks?: Nemotron[]; strict?: boolean } = {},
): Promise<{ json: unknown; model: Nemotron; usage: Usage }> {
  let last: Error = new Error("No model answered");
  // Stay inside one serverless invocation (300s): the job step retries anything past that anyway.
  const deadline = Date.now() + 250_000;
  // `fallbacks`: the models to try if this one is busy or slow; [] means fail instead (Free lessons, see build-course.ts).
  for (const candidate of [model, ...fallbacks]) {
    for (const wait of [0, 2000, 6000]) {
      const left = deadline - Date.now() - wait;
      if (left < 20_000) throw last;
      await sleep(wait);
      const started = Date.now();
      try {
        const { json, usage } = await callNemotron(candidate, system, user, schema, think, maxTokens, Math.min(120_000, left), strict);
        return { json, model: candidate, usage };
      } catch (error) {
        if (!(error instanceof Busy)) throw error;
        last = error;
        // Record why a model was skipped, so a lesson written by a backup model can be explained from the logs.
        const seconds = Math.round((Date.now() - started) / 1000);
        console.warn(`[nemotron] ${AI.modelNames[candidate]} failed after ${seconds}s (${error instanceof TimedOut ? "timed out" : "busy or bad answer"}): ${error.message.slice(0, 200)}`);
        if (error instanceof TimedOut) break; // a slow model won't get faster: try the next one
      }
    }
  }
  throw last;
}
