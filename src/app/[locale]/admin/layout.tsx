import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { Navbar } from "@/components/layout/Navbar";
import Link from "next/link";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  const { locale } = await params;

  if (!isAdmin(session?.user?.email)) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 flex-1">
        {/* Admin breadcrumb header */}
        <div className="mb-6 flex items-center gap-2 text-sm text-text-secondary">
          <Link href={`/${locale}/admin`} className="hover:text-text transition-colors font-medium">
            Admin
          </Link>
          <span>/</span>
          <span>Templates</span>
        </div>
        {children}
      </div>
    </>
  );
}
