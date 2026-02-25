import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium-min", "puppeteer-core"],
  async redirects() {
    return [
      // /[locale]/admin → /[locale]/admin/templates
      {
        source: "/:locale/admin",
        destination: "/:locale/admin/templates",
        permanent: false,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
