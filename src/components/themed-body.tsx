"use client";

import React from 'react';
import { useTheme } from '@/providers/theme-provider';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export function ThemedBody({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <body
      className={cn(
        'antialiased',
        inter.variable,
        theme === 'confesh' ? 'font-arial' : 'font-body'
      )}
    >
      {children}
    </body>
  );
}
