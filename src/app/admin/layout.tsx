'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Loader2, LogOut, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sidebar, type SidebarSection } from '@/components/shared/organisms/sidebar';
import { Header } from '@/components/shared/organisms/header';
import { ADMIN_NAV_ITEMS } from '@/constants/navigation';
import { Modal } from '@/components/shared/molecules/modal';
import { useNotificationStore } from '@/store/notification-store';
import { NotificationCenter } from '@/components/shared/notification-center';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount, loadNotifications } = useNotificationStore();

  useEffect(() => {
    setMounted(true);
    if (user) {
      loadNotifications(user.id);
    }
  }, [user, loadNotifications]);

  useEffect(() => {
    if (mounted && !isLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (user?.role !== 'admin') {
        router.replace('/dashboard');
      }
    }
  }, [mounted, isAuthenticated, user, isLoading, router]);

  if (!mounted || isLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-red" />
      </div>
    );
  }

  const sidebarSections: SidebarSection[] = [
    {
      label: "Management",
      items: ADMIN_NAV_ITEMS.map(item => ({
        ...item
      }))
    }
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const branding = {
    logo: <img src="/logo.png" alt="ArachnidsArk" className="h-20 w-auto object-contain" />,
    smallLogo: <img src="/logo-small.png" alt="AA" className="h-18 w-18 object-contain" />
  };

  return (
    <div className="flex min-h-screen md:h-[100dvh] md:overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block shrink-0 relative z-50">
        <Sidebar
          {...branding}
          sections={sidebarSections}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          footerAction={{
            label: "Logout",
            icon: LogOut,
            onClick: handleLogout
          }}
        />
      </aside>

      {/* Mobile Sidebar */}
      <Modal
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        variant="side-left"
        noPadding
        showHeader={false}
        showCloseButton={false}
      >
        <Sidebar
          {...branding}
          sections={sidebarSections}
          isCollapsed={false}
          onToggleCollapse={() => setIsMobileOpen(false)}
          onItemClick={() => setIsMobileOpen(false)}
          isMobile={true}
          footerAction={{
            label: "Logout",
            icon: LogOut,
            onClick: handleLogout
          }}
        />
      </Modal>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:overflow-hidden">
        <Header
          showMobileMenu
          onMenuClick={() => setIsMobileOpen(true)}
          user={{
            name: user.name,
            email: user.email,
            image: user.avatar
          }}
          onLogout={handleLogout}
          onNotificationClick={() => setShowNotifications(true)}
          unreadCount={unreadCount}
        />
        <NotificationCenter open={showNotifications} onOpenChange={setShowNotifications} />

        <main className="flex-1 md:overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
