'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/providers/theme-provider';
import { useSettings } from '@/hooks/use-settings';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export function ThemedBody({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const { settings } = useSettings();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => setHasMounted(true), []);

  useEffect(() => {
    if (!hasMounted) return;
    const fontClass = 
      settings.fontFamily === 'shantell' ? 'shantell-sans' : 
      settings.fontFamily === 'dyslexia' ? 'dyslexia-font' : '';
    const bodyClass = cn(
      'antialiased',
      inter.variable,
      theme === 'confesh' ? 'font-arial' : 'font-body',
      fontClass
    );
    document.body.className = bodyClass;
  }, [theme, settings.fontFamily, hasMounted]);

  return <>{hasMounted && children}</>;
}
