import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  if (session.user.role !== "ADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="min-h-screen flex bg-surface">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader userName={session.user.name} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </NextIntlClientProvider>
  );
}
