// The fixed topics and languages Community filters on. A fixed list keeps the filters clean: no "ML" next to
// "Machine Learning". Picked from what's really on CourseIt (Nov 2026). The AI chooses from these (course-tagger.ts).
export const COURSE_TAGS = [
  { id: "programming", label: "Programming" },
  { id: "web", label: "Web development" },
  { id: "ai-data", label: "AI & data" },
  { id: "cs", label: "CS fundamentals" },
  { id: "cloud", label: "Cloud & DevOps" },
  { id: "school", label: "School" },
  { id: "entrance", label: "Entrance exams" },
  { id: "college", label: "College subjects" },
  { id: "maths", label: "Maths" },
  { id: "science", label: "Science" },
  { id: "business", label: "Business & marketing" },
  { id: "finance", label: "Finance & accounting" },
  { id: "design", label: "Design" },
  { id: "career", label: "Career & interviews" },
  { id: "languages", label: "Spoken languages" },
  { id: "other", label: "Other" },
] as const;

export const COURSE_LANGUAGES = [
  { id: "english", label: "English" },
  { id: "hindi", label: "Hindi" },
  { id: "other", label: "Other languages" },
] as const;

export type CourseTag = (typeof COURSE_TAGS)[number]["id"];
export type CourseLanguage = (typeof COURSE_LANGUAGES)[number]["id"];

export const isCourseTag = (id: unknown): id is CourseTag => COURSE_TAGS.some((t) => t.id === id);
export const isCourseLanguage = (id: unknown): id is CourseLanguage => COURSE_LANGUAGES.some((l) => l.id === id);
export const tagLabel = (id: string) => COURSE_TAGS.find((t) => t.id === id)?.label ?? null;
