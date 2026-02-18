import { Navbar } from "@/components/layout/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 flex-1">{children}</div>
    </>
  );
}
