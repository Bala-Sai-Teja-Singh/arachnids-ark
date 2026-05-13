'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';
import { usePathname } from 'next/navigation';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const { loadNotifications } = useNotificationStore();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pathname]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotifications(user.id);
    }
  }, [isAuthenticated, user, loadNotifications]);

  return <>{children}</>;
}
