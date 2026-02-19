import { Link } from "@/lib/i18n/navigation";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-bold text-primary/20 mb-4">404</p>

        <h2 className="text-2xl font-bold text-text mb-3">
          Page not found
        </h2>
        <p className="text-text-secondary mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/templates"
            className="px-6 py-2.5 border border-border text-text-secondary font-medium rounded-lg hover:bg-surface-hover transition-colors"
          >
            Browse templates
          </Link>
        </div>
      </div>
    </div>
  );
}
