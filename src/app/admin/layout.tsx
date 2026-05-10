'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminHeader } from '@/components/layout/admin-header';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (user?.role !== 'admin') {
        router.replace('/dashboard');
      }
    }
  }, [mounted, isAuthenticated, user, isLoading, router]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (!mounted || isLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-red" />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:block shrink-0 transition-all duration-300 relative z-50 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <AdminSidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader isSidebarCollapsed={isSidebarCollapsed} />
        <main className={cn(
          "flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 transition-all duration-300",
          isSidebarCollapsed ? "md:pl-4" : "md:pl-6"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
