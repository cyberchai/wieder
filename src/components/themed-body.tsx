'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/providers/theme-provider';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export function ThemedBody({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => setHasMounted(true), []);

  useEffect(() => {
    if (!hasMounted) return;
    const bodyClass = cn(
      'antialiased',
      inter.variable,
      theme === 'confesh' ? 'font-arial' : 'font-body'
    );
    document.body.className = bodyClass;
  }, [theme, hasMounted]);

  return <>{hasMounted && children}</>;
}
