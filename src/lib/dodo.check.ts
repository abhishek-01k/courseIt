// Run: pnpm dlx tsx src/lib/dodo.check.ts
// The webhook check must accept Dodo's real signatures and reject everything else.
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyWebhook } from "./dodo";

const rawKey = Buffer.from("courseit-test-key-0123456789abcd");
process.env.DODO_PAYMENTS_WEBHOOK_KEY = `whsec_${rawKey.toString("base64")}`;

const body = JSON.stringify({ type: "subscription.active", data: { subscription_id: "sub_123" } });
const sign = (id: string, ts: string, payload: string, key = rawKey) => createHmac("sha256", key).update(`${id}.${ts}.${payload}`).digest("base64");
const headers = (id: string, ts: string, signature: string) => new Headers({ "webhook-id": id, "webhook-timestamp": ts, "webhook-signature": signature });
const now = String(Math.floor(Date.now() / 1000));

assert.equal(verifyWebhook(body, headers("msg_1", now, `v1,${sign("msg_1", now, body)}`)), true, "valid");
assert.equal(verifyWebhook(body, headers("msg_1", now, `v1,bad v1,${sign("msg_1", now, body)}`)), true, "any v1 entry may match");
assert.equal(verifyWebhook(body + " ", headers("msg_1", now, `v1,${sign("msg_1", now, body)}`)), false, "body changed");
assert.equal(verifyWebhook(body, headers("msg_2", now, `v1,${sign("msg_1", now, body)}`)), false, "id changed");
assert.equal(verifyWebhook(body, headers("msg_1", now, `v1,${sign("msg_1", now, body, Buffer.from("other"))}`)), false, "wrong key");
assert.equal(verifyWebhook(body, headers("msg_1", now, `v2,${sign("msg_1", now, body)}`)), false, "unknown version");
const old = String(Number(now) - 600);
assert.equal(verifyWebhook(body, headers("msg_1", old, `v1,${sign("msg_1", old, body)}`)), false, "older than 5 minutes");
assert.equal(verifyWebhook(body, new Headers()), false, "no headers");
delete process.env.DODO_PAYMENTS_WEBHOOK_KEY;
assert.equal(verifyWebhook(body, headers("msg_1", now, `v1,${sign("msg_1", now, body)}`)), false, "no secret set");

console.log("dodo webhooks: ok");
