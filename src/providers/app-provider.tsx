'use client';

import { useEffect, useState } from 'react';
import { seedDatabase } from '@/mock-db/seed';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const { loadNotifications } = useNotificationStore();

  useEffect(() => {
    seedDatabase();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotifications(user.id);
    }
  }, [isAuthenticated, user, loadNotifications]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading ArachnidsArk...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
