// Root-level 404 — rendered for paths outside any [locale] segment
// (e.g. /unknown-locale/...). No next-intl context available here.
export default function RootNotFound() {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <p className="text-8xl font-bold text-primary/20 mb-4">404</p>
          <h1 className="text-2xl font-bold mb-3">Page not found</h1>
          <p className="text-gray-500 mb-8">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
          <a
            href="/he"
            className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}
