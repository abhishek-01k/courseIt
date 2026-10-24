"use server";

import { signIn } from "@/lib/auth";
import { AUTH_PROVIDERS } from "@/lib/constants";
import type { AuthProviderId } from "@/types/login";

export async function signInWith(provider: AuthProviderId) {
  // The provider id comes from the browser, so only accept the ones we offer.
  if (!AUTH_PROVIDERS.some((p) => p.id === provider)) throw new Error("Unknown sign-in provider");
  await signIn(provider, { redirectTo: "/dashboard" });
}
