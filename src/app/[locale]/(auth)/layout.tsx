import { Link } from "@/lib/i18n/navigation";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <div className="flex items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">LD</span>
          </div>
          <span className="font-bold text-xl text-text">LegAIDoc</span>
        </Link>
        <LocaleSwitcher />
      </div>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
