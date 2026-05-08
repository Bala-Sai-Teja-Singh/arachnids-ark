'use client';

import { Menu, Search, Bell } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { AdminSidebar } from './admin-sidebar';
import { useAuthStore } from '@/store/auth-store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNotificationStore } from '@/store/notification-store';
import { NotificationCenter } from '../shared/notification-center';
import { useState, useEffect } from 'react';

export function AdminHeader() {
  const { user } = useAuthStore();
  const { unreadCount, loadNotifications } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications(user.id);
    }
  }, [user, loadNotifications]);

  return (
    <header className="h-16 flex items-center justify-between px-4 border-b border-border bg-background sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {/* Mobile Sidebar Toggle */}
        <Sheet>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" />}>
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-r border-border">
            <AdminSidebar />
          </SheetContent>
        </Sheet>


      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          onClick={() => setShowNotifications(true)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand-red rounded-full ring-2 ring-background animate-pulse-glow"></span>
          )}
        </Button>
        <NotificationCenter open={showNotifications} onOpenChange={setShowNotifications} />
        <div className="flex items-center gap-2 border-l border-border pl-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-xs text-muted-foreground mt-1">Administrator</p>
          </div>
          <Avatar className="h-8 w-8 border border-brand-red/30">
            <AvatarFallback className="bg-brand-red/10 text-brand-red text-xs">
              {user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
