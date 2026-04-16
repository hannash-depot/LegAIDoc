'use client';

import { createContext, useContext, type ReactNode } from 'react';

interface LogoContextType {
  logoUrl: string;
  logoHeight: number;
}

const LogoContext = createContext<LogoContextType>({
  logoUrl: '/images/logo-default.svg',
  logoHeight: 36,
});

export function LogoProvider({
  logoUrl,
  logoHeight,
  children,
}: LogoContextType & { children: ReactNode }) {
  return <LogoContext.Provider value={{ logoUrl, logoHeight }}>{children}</LogoContext.Provider>;
}

export function useLogoSettings() {
  return useContext(LogoContext);
}
