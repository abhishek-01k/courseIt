"use client";

import { useEffect } from "react";
import { recordVisitAction } from "@/modules/dashboard/actions";

// Once per app load: today counts toward the streak as soon as the learner opens CourseIt.
export default function RecordVisit() {
  useEffect(() => {
    recordVisitAction(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);
  return null;
}
