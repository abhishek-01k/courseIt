// Run: pnpm dlx tsx src/lib/paths.check.ts
import assert from "node:assert/strict";
import { safeNext } from "./paths";

// Where sign-in may send someone back to: only a path on this site.
assert.equal(safeNext("/roadmaps/x"), "/roadmaps/x");
assert.equal(safeNext("http://localhost:3000/courses/a/1"), "/courses/a/1"); // Auth.js sends full URLs
assert.equal(safeNext("https://evil.com/steal"), "/steal"); // another site's URL keeps only its path, here
assert.equal(safeNext("//evil.com"), "/"); // read as a site address: only its path, our home page
assert.equal(safeNext("/\\evil.com"), "/");
assert.equal(safeNext("http://x//evil.com"), "/dashboard"); // a path starting // would leave the site
assert.equal(safeNext(undefined), "/dashboard");
console.log("paths: ok");
