export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  replaySeconds: number;
};

export type FocusPlayerHandle = { playFrom: (absoluteSeconds: number) => void };

export type FocusPlayerProps = {
  lessonId: string;
  videoId: string;
  start: number;
  end: number;
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
  initialNote: string;
  next: { href: string; position: number; title: string; sameDay: boolean; thumbnail: string | null } | null;
  day: number;
  quizDone: boolean;
  header: React.ReactNode; // title, day and lesson position
  studyNotes: React.ReactNode; // Nemotron's notes, rendered on the server
  playlist: React.ReactNode;
};
