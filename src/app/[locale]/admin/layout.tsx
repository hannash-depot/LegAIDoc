import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { Navbar } from "@/components/layout/Navbar";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  const { locale } = await params;

  // Not logged in → send to login
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  // Logged in but not admin → 403 page
  if (!isAdmin(session.user.email)) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-text mb-2">403</h1>
            <p className="text-text-secondary mb-6">
              You don&apos;t have permission to access the admin area.
            </p>
            <a
              href={`/${locale}/dashboard`}
              className="text-primary hover:underline"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 flex-1">
        {children}
      </div>
    </>
  );
}
