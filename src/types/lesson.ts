import type { Note } from "@/modules/lesson/actions";
export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  replaySeconds: number;
};

export type FocusPlayerHandle = {
  playFrom: (absoluteSeconds: number) => void;
  now: () => number; // where the video is, in seconds of the whole video
};

export type FocusPlayerProps = {
  lessonId: string;
  videoId: string;
  start: number;
  end: number;
  startAt?: number; // open at this moment (seconds of the whole video), e.g. from a note link
  marks?: number[]; // note times (seconds of the whole video), shown as dots on the timeline
  autoStart?: boolean;
  endScreen?: React.ReactNode; // shown in place of the stopped player when the lesson ends
  onEnded?: () => void;
  onPlay?: () => void;
  onWatched?: () => void; // first time the lesson reaches 80% watched

};

export type LessonViewProps = {
  courseId: string;
  courseHref: string; // /courses/<slug>
  lessonId: string;
  videoId: string;
  startSeconds: number;
  endSeconds: number;
  ready: boolean;
  writing: boolean; // not ready yet but still being built (false = it failed; retry from the course page)
  questions: QuizQuestion[];
  initialAnswers: Record<string, number>; // questionId → chosen option, from earlier visits
  initialNotes: Note[];
  startAt?: number;
  next: { href: string; position: number; title: string; sameDay: boolean; thumbnail: string | null } | null;
  day: number;
  quizDone: boolean;
  header: React.ReactNode; // title, day and lesson position
  studyNotes: React.ReactNode; // Nemotron's notes, rendered on the server
  playlist: React.ReactNode;
};
