import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Twitter from "next-auth/providers/twitter";
import { db } from "@/db";
import { accounts, users } from "@/db/schema";
import { queueEmail } from "@/inngest/send-email";

// Provider keys are read from env: AUTH_GOOGLE_ID/SECRET, AUTH_GITHUB_ID/SECRET, AUTH_TWITTER_ID/SECRET.
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, { usersTable: users, accountsTable: accounts }),
  // Users live in the database; the session stays in a signed cookie, so pages never wait on a lookup.
  session: { strategy: "jwt" },
  providers: [Google, GitHub, Twitter],
  pages: { signIn: "/login", error: "/login" },
  events: {
    // A brand-new account (first sign-in ever): the welcome email. queueEmail never throws, so sign-in can't fail here.
    async createUser({ user }) {
      if (user.id) await queueEmail("welcome", user.id, `welcome:${user.id}`, {});
    },
  },
  callbacks: {
    // Runs in src/proxy.ts. Optimistic check only: pages still read the session themselves.
    authorized({ auth: session, request: { nextUrl } }) {
      const signedIn = Boolean(session?.user);
      if (nextUrl.pathname.startsWith("/login")) {
        return signedIn ? Response.redirect(new URL("/dashboard", nextUrl)) : true;
      }
      return signedIn;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
