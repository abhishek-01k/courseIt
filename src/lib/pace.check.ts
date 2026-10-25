// Run: pnpm dlx tsx src/lib/pace.check.ts
import assert from "node:assert/strict";
import { packDays } from "./pace";

const m = (n: number) => n * 60;
assert.deepEqual(packDays([m(10), m(10), m(10), m(10)], 30), [1, 1, 1, 2]); // 30 min fits, 40 > 36
assert.deepEqual(packDays([m(20), m(15)], 30), [1, 1]); // 35 min is within 20% over
assert.deepEqual(packDays([m(50), m(5), m(5)], 30), [1, 2, 2]); // a long lesson gets its own day
assert.deepEqual(packDays([], 30), []);
assert.deepEqual(packDays([m(10), m(10), m(10)], 120), [1, 1, 1]);
console.log("pace checks passed");
