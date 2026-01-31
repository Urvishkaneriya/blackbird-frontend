'use client';

import { useEffect, type ReactNode } from 'react';
import { AuthProvider } from './context/AuthContext';

function ThemeInitializer({ children }: { children: ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored ?? (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeInitializer>
      <AuthProvider>{children}</AuthProvider>
    </ThemeInitializer>
  );
}
