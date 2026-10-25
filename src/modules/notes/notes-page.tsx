import { NotebookPen } from "lucide-react";
import EmptyState from "@/components/empty-state";
import PageHeader from "@/components/page-header";

export default function NotesPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 px-4 pt-8 pb-20 sm:px-6">
      <PageHeader label="Notes" title="Your notes," accent="all in one place." />
      <EmptyState icon={NotebookPen} title="No notes yet" text="Notes you take during lessons show up here, linked to the lesson and timestamp." />
    </div>
  );
}
