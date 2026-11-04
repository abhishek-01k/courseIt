import { createHmac, timingSafeEqual } from "node:crypto";
import { appUrl } from "@/emails/layout";

// Unsubscribe links in announcement emails: signed with AUTH_SECRET, so the link only works for its own learner
// and can't be guessed for anyone else. No expiry: an old email's link should still work.
const sign = (userId: string) => createHmac("sha256", process.env.AUTH_SECRET ?? "").update(`unsubscribe:news:${userId}`).digest("base64url");

export const unsubscribeUrl = (userId: string) => appUrl(`/api/email/unsubscribe?u=${encodeURIComponent(userId)}&t=${sign(userId)}`);

export function verifyUnsubscribe(userId: string, token: string) {
  const expected = Buffer.from(sign(userId));
  const given = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
