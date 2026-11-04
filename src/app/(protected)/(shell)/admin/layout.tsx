import { Suspense } from "react";
import PageHeader from "@/components/page-header";
import { requireAdmin } from "@/lib/admin";
import AdminTabs from "@/modules/admin/components/admin-tabs";

// The tabs only render for admins, so the admin area doesn't show its shape to anyone else.
async function Tabs() {
  await requireAdmin();
  return <AdminTabs />;
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-4 pt-8 pb-20 sm:px-6">
      <PageHeader label="Admin" title="Everything on" accent="CourseIt." />
      <Suspense fallback={<div className="h-10" />}>
        <Tabs />
      </Suspense>
      {children}
    </div>
  );
}
