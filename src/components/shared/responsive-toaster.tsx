'use client';

import { Toaster as SonnerToaster } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export function ResponsiveToaster() {
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <SonnerToaster
      position={isMobile ? 'top-center' : 'top-right'}
      richColors
      closeButton
      theme={theme as 'light' | 'dark' | 'system'}
      toastOptions={{
        className: 'vibe-toast',
        classNames: {
          toast: 'vibe-card border-border backdrop-blur-xl bg-background text-foreground shadow-2xl font-bold',
        },
      }}
    />
  );
}
