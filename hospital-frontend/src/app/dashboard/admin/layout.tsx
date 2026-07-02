import { Sidebar } from "@/components/admin/Sidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 w-full">
      <Sidebar />
      <div className="flex-1 overflow-y-auto relative bg-gray-50 dark:bg-gray-900 flex flex-col">
        <AdminHeader />
        {/* Scrollable content container */}
        <main className="flex-1 w-full max-w-[1700px] mx-auto px-8 pb-8 pt-6 relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
