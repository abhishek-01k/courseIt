"use client";

import { useEffect } from "react";
import { markInboxReadAction } from "../actions";

// Marks the Inbox read once it's on screen (not during render), so this visit still shows what was new.
export default function MarkRead() {
  useEffect(() => {
    void markInboxReadAction();
  }, []);
  return null;
}
