import { requireAdminPage } from '@/lib/api/require-admin';
import { AdminSidebar } from './_components/admin-sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // RBAC check: will throw/redirect if not an admin
  await requireAdminPage();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col md:flex-row">
      {/* Sidebar for medium and larger screens */}
      <aside className="border-border bg-muted/30 w-full border-r md:w-64">
        <AdminSidebar />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
    </div>
  );
}
