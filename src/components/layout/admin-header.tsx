'use client';

import { Menu, Bell, Settings, LogOut, Shield } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { AdminSidebar } from './admin-sidebar';
import { useAuthStore } from '@/store/auth-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNotificationStore } from '@/store/notification-store';
import { NotificationCenter } from '../shared/notification-center';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AdminHeader({ isSidebarCollapsed = false }: { isSidebarCollapsed?: boolean }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { unreadCount, loadNotifications } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications(user.id);
    }
  }, [user, loadNotifications]);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <header className={cn(
      "h-16 flex items-center justify-between px-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40 shrink-0",
    )}>
      <div className="flex items-center gap-4">
        {/* Mobile Sidebar Toggle */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden border border-border rounded-lg" />}>
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-transparent border-none shadow-none w-72!" showCloseButton={true}>
            <AdminSidebar onItemClick={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="relative border border-border rounded-lg"
          onClick={() => setShowNotifications(true)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-brand-red border-0">
              {unreadCount}
            </Badge>
          )}
        </Button>
        <NotificationCenter open={showNotifications} onOpenChange={setShowNotifications} />

        <DropdownMenu>
          <DropdownMenuTrigger render={
            <button className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-border ml-1 sm:ml-2 hover:bg-accent/50 transition-all p-1 px-2 group">
              <Avatar className="h-8 w-8 transition-transform group-active:scale-95 border border-border">
                {user?.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                <AvatarFallback className="bg-brand-red text-white font-bold text-xs uppercase">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </button>
          } />
          <DropdownMenuContent align="end" className="w-64 glass border-border mt-2 p-2">
            <div className="px-3 py-3 border-b border-border/50 mb-2">
              <p className="text-sm font-bold truncate text-foreground">{user?.name}</p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{user?.email}</p>
            </div>
            
            <DropdownMenuItem onClick={() => router.push('/admin/profile')} className="gap-2 cursor-pointer focus:bg-brand-red/10 focus:text-brand-red rounded-lg py-2">
              <Settings className="h-4 w-4" /> Profile Settings
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-border/50 my-2" />
            
            <DropdownMenuItem onClick={handleLogout} className="gap-2 text-brand-red focus:bg-brand-red focus:text-white cursor-pointer rounded-lg py-2">
              <LogOut className="h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
