// Sets the description of every CourseIt product in Dodo (the line shown on checkout and in the customer portal) to
// match the plans in src/lib/plans.ts. Uses the mode in DODO_PAYMENTS_ENVIRONMENT and its key, so run it once per mode:
//   node --env-file=.env.local scripts/dodo-product-descriptions.mjs
// For live mode, run it with the live key and DODO_PAYMENTS_ENVIRONMENT=live_mode and the live DODO_PRODUCT_* ids.
const base = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "https://live.dodopayments.com" : "https://test.dodopayments.com";
const TEXT = {
  PRO: "20 hours of video a month, courses up to 10 hours each. Your courses stay private. Retry failed builds.",
  MAX: "40 hours of video a month, courses up to 20 hours each. Your courses stay private. Highest build priority.",
};
let failed = 0;
for (const plan of ["PRO", "MAX"]) {
  for (const interval of ["MONTHLY", "YEARLY"]) {
    for (const region of ["", "_IN", "_GB"]) {
      const name = `DODO_PRODUCT_${plan}_${interval}${region}`;
      const id = process.env[name];
      if (!id) { console.log(`${name}: not set, skipped`); continue; }
      const res = await fetch(`${base}/products/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${process.env.DODO_PAYMENTS_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ description: TEXT[plan] }),
      });
      if (!res.ok) failed++;
      console.log(`${name}: ${res.ok ? "updated" : `failed ${res.status} ${(await res.text()).slice(0, 200)}`}`);
    }
  }
}
process.exit(failed ? 1 : 0);
