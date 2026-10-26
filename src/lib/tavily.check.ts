// Run: pnpm dlx tsx src/lib/tavily.check.ts
// A bad Tavily answer must never throw or store a link the lesson page can't render.
import assert from "node:assert/strict";
import { findReading } from "./tavily";

const reply = (body: unknown, status = 200) => async () => new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
const run = async (fetchImpl: () => Promise<Response>) => {
  globalThis.fetch = fetchImpl as typeof fetch;
  return findReading("Backpropagation (Neural networks)");
};
console.error = () => {}; // the failures below are expected

async function main() {
  process.env.TAVILY_API_KEY = "";
  assert.deepEqual(await run(reply({ results: [{ title: "x", url: "https://x.dev" }] })), [], "no key: no call");
  process.env.TAVILY_API_KEY = "tvly-test";

  // Failures: all return [], none throw.
  assert.deepEqual(await run(reply("rate limited", 429)), []);
  assert.deepEqual(await run(reply("<html>oops</html>")), [], "not JSON");
  assert.deepEqual(await run(reply("null")), [], "JSON null");
  assert.deepEqual(await run(reply({ results: "nope" })), [], "results not a list");
  assert.deepEqual(await run(reply({})), [], "no results");
  assert.deepEqual(await run(async () => { throw new TypeError("fetch failed"); }), [], "network error");
  assert.deepEqual(await run(async () => { throw new DOMException("timed out", "TimeoutError"); }), [], "timeout");

  // Bad entries are skipped one by one; good ones survive.
  const mixed = await run(
    reply({
      results: [
        null,
        { title: "No link" },
        { title: "  ", url: "https://blank-title.dev" },
        { title: "Broken", url: "https://" },
        { title: "Spaces", url: "http://exa mple.com" },
        { title: "Script", url: "javascript:alert(1)" },
        { title: "FTP", url: "ftp://files.dev/a" },
        { title: " Good one ", url: "https://cs231n.github.io/optimization-2/" },
        { title: "Also good", url: "http://neuralnetworksanddeeplearning.com/chap2.html" },
      ],
    }),
  );
  assert.deepEqual(mixed, [
    { title: "Good one", url: "https://cs231n.github.io/optimization-2/" },
    { title: "Also good", url: "http://neuralnetworksanddeeplearning.com/chap2.html" },
  ]);
  for (const r of mixed) new URL(r.url); // what lesson-notes.tsx does when it renders

  // At most 3, titles capped.
  const many = await run(reply({ results: Array.from({ length: 6 }, (_, i) => ({ title: "t".repeat(500), url: `https://site${i}.dev` })) }));
  assert.equal(many.length, 3);
  assert.equal(many[0].title.length, 200);

  console.log("tavily: ok");
}

main().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exit(1);
});
