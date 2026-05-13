'use client';

import { useEffect, useState } from 'react';
import { seedDatabase } from '@/mock-db/seed';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';
import { usePathname } from 'next/navigation';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const { loadNotifications } = useNotificationStore();
  const pathname = usePathname();

  useEffect(() => {
    seedDatabase();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

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
