import { db } from '@/lib/db';

export interface LogoSettings {
  logoUrl: string;
  logoHeight: number;
}

const DEFAULT_LOGO: LogoSettings = {
  logoUrl: '/images/logo-default.svg',
  logoHeight: 36,
};

export async function getLogoSettings(): Promise<LogoSettings> {
  try {
    const settings = await db.siteSetting.findMany({
      where: { key: { in: ['logo_url', 'logo_height'] } },
    });

    return {
      logoUrl: settings.find((s) => s.key === 'logo_url')?.value ?? DEFAULT_LOGO.logoUrl,
      logoHeight: parseInt(
        settings.find((s) => s.key === 'logo_height')?.value ?? String(DEFAULT_LOGO.logoHeight),
        10,
      ),
    };
  } catch {
    return DEFAULT_LOGO;
  }
}
