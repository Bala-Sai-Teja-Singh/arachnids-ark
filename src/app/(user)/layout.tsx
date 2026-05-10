'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { MobileNav } from '@/components/layout/mobile-nav';
import { UserSidebar } from '@/components/layout/user-sidebar';
import { useAuthStore } from '@/store/auth-store';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const isDashboard = pathname.startsWith('/dashboard');
  const showSidebar = isAuthenticated && !isLoading;

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden h-screen">
      <div className="flex flex-1 relative">
        {/* Desktop Sidebar - Visible site-wide when logged in */}
        {showSidebar && (
          <aside className={`hidden md:block shrink-0 bg-card border-r border-border shadow-xl transition-all duration-300 relative z-50 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
            <UserSidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
          </aside>
        )}

        {/* Right Side Content (Navbar + Main Content) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <Navbar isSidebarCollapsed={isSidebarCollapsed} />
          
          <main className="flex-1 overflow-y-auto">
            {/* Mobile Sidebar Toggle - Visible site-wide when logged in */}
            {showSidebar && (
              <div className="md:hidden fixed bottom-24 right-6 z-40">
                <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                  <SheetTrigger
                    render={
                      <Button size="icon" className="h-12 w-12 rounded-full shadow-2xl bg-brand-red text-white border-4 border-background hover:scale-110 transition-transform">
                        <Menu className="h-6 w-6" />
                      </Button>
                    }
                  />
                  <SheetContent side="left" className="p-0 bg-transparent border-none shadow-none w-72!" showCloseButton={true}>
                    <UserSidebar onItemClick={() => setIsSidebarOpen(false)} />
                  </SheetContent>
                </Sheet>
              </div>
            )}

            <div className="flex-1 w-full">
              {children}
            </div>
            {!isDashboard && <Footer />}
          </main>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
