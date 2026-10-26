"use client";

import { useSearchParams } from "next/navigation";
import ProviderButtons from "./provider-buttons";

// Auth.js (and our "Sign in to …" links) pass the page to return to as ?callbackUrl=.
export default function ProviderButtonsNext() {
  return <ProviderButtons next={useSearchParams().get("callbackUrl") ?? undefined} />;
}
