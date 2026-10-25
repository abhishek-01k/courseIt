"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Re-renders the server page every few seconds while the course builds. Only mounted until it's ready.
export default function RefreshWhileBuilding() {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), 2000);
    return () => clearInterval(timer);
  }, [router]);
  return null;
}
