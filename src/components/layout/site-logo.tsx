'use client';

import { cn } from '@/lib/utils/cn';

interface SiteLogoProps {
  logoUrl: string;
  height?: number;
  className?: string;
}

export function SiteLogo({ logoUrl, height = 36, className }: SiteLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt="LegAIDoc"
      style={{ height: `${height}px` }}
      className={cn('w-auto object-contain', className)}
    />
  );
}
