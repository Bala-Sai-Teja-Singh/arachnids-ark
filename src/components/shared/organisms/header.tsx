'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Menu, Search, Bell, User, LogOut } from 'lucide-react';
import { Button } from '@/components/shared/atoms/button';
import { Input } from '@/components/shared/atoms/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme-toggle';

/**
 * Universal Header Organism.
 * Replaces AdminHeader and standardizes top navigation across the platform.
 */
export interface HeaderProps {
  /** If true, the mobile sidebar trigger is visible */
  showMobileMenu?: boolean;
  /** Callback for mobile menu trigger */
  onMenuClick?: () => void;
  /** Optional title or breadcrumb area */
  title?: React.ReactNode;
  /** Optional search handler */
  onSearch?: (query: string) => void;
  /** User information for the profile dropdown */
  user?: {
    name: string;
    email: string;
    image?: string;
  };
  /** Callback for logout */
  onLogout?: () => void;
  /** Callback for notification trigger */
  onNotificationClick?: () => void;
  /** Number of unread notifications */
  unreadCount?: number;
  /** Optional children for center area (e.g., links) */
  children?: React.ReactNode;
  /** CSS class for custom styling */
  className?: string;
}

import { usePathname } from 'next/navigation';
import { PAGE_TITLES } from '@/constants/navigation';

export function Header({
  showMobileMenu,
  onMenuClick,
  title: providedTitle,
  onSearch,
  user,
  onLogout,
  onNotificationClick,
  unreadCount = 0,
  children,
  className
}: HeaderProps) {
  const pathname = usePathname();
  
  // Resolve title from pathname if not provided
  const resolvedTitle = providedTitle || (
    <div className="flex items-center gap-2">
      <span className="text-sm font-black uppercase tracking-[0.2em] text-foreground/80">
        {PAGE_TITLES[pathname] || 'Dashboard'}
      </span>
    </div>
  );
  return (
    <header className={cn(
      "h-16 flex items-center justify-between px-4 md:px-8 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40 shrink-0 transition-all duration-300",
      className
    )}>
      {/* Left Area: Title & Mobile Trigger */}
      <div className="flex items-center gap-4">
        {showMobileMenu && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
            leftIcon={<Menu className="h-5 w-5" />}
          />
        )}
        
        {resolvedTitle && (
          <div className="hidden sm:block animate-in fade-in slide-in-from-left-4 duration-300">
            {resolvedTitle}
          </div>
        )}
      </div>

      {/* Center Area: Custom Content / Navigation */}
      <div className="flex-1 flex justify-center px-4 max-w-xl mx-auto">
        {onSearch && (
          <Input
            placeholder="Search anything..."
            leftIcon={<Search className="h-4 w-4" />}
            className="hidden md:flex h-9 bg-muted/30 border-none"
            onChange={(e) => onSearch(e.target.value)}
          />
        )}
        {children}
      </div>

      {/* Right Area: Actions & Profile */}
      <div className="flex items-center gap-2 md:gap-4">
        <ThemeToggle />
        {/* Notifications */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground relative"
          onClick={onNotificationClick}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-red rounded-full border-2 border-background" />
          )}
        </Button>

        {/* User Profile Dropdown */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <button className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-colors outline-none">
                <Avatar className="h-8 w-8 border-2 border-brand-gold/20">
                  <AvatarImage src={user.image} alt={user.name} />
                  <AvatarFallback className="bg-brand-gold/10 text-brand-gold font-bold text-xs">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </button>
            } />
            <DropdownMenuContent className="w-56 bg-background border-border shadow-xl mt-2" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onLogout} className="text-brand-red focus:text-brand-red cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button premium size="sm">Sign In</Button>
        )}
      </div>
    </header>
  );
}
