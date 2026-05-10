'use client';

import { ChevronLeft, ChevronRight, LogOut, X } from 'lucide-react';
import { DASHBOARD_NAV_ITEMS, USER_NAV_ITEMS } from '@/constants/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function UserSidebar({
  onItemClick,
  isCollapsed = false,
  onToggleCollapse
}: {
  onItemClick?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  if (!mounted) return null;

  const renderLink = (item: any, hrefPrefix: string = '') => {
    const Icon = item.icon;
    const isActive = pathname === item.href || (item.href !== '/' && item.href !== '/dashboard' && pathname.startsWith(item.href));

    const linkContent = (
      <Link
        href={item.href}
        onClick={() => onItemClick?.()}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300 group relative",
          isActive
            ? 'bg-brand-red/10 text-brand-red font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
          isCollapsed && "justify-center px-0"
        )}
      >
        <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-brand-red" : "group-hover:scale-110 transition-transform")} />
        {!isCollapsed && <span className="truncate">{item.label}</span>}
        {isCollapsed && isActive && (
          <div className="absolute left-0 w-1 h-6 bg-brand-red rounded-r-full" />
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger render={linkContent} />
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.href}>{linkContent}</div>;
  };

  return (
    <TooltipProvider delay={0}>
      <div className={cn(
        "flex flex-col h-full bg-card border-r border-border shadow-sm transition-all duration-300 relative",
        isCollapsed ? "w-20" : onItemClick ? "w-full" : "w-64"
      )}>
        {/* Brand */}
        <div className={cn(
          "flex items-center justify-between shrink-0 px-6 border-b border-border/50 md:border-none",
          onItemClick ? "h-20" : "h-24"
        )}>
          <Link href="/" className="flex items-center flex-1 overflow-hidden">
            <div className={cn(
              "flex items-center justify-start transition-all duration-300",
              isCollapsed ? "opacity-0 scale-0 w-0" : "opacity-100 scale-100"
            )}>
              <img src="/logo.png" alt="ArachnidsArk" className="h-auto w-[180px] object-contain" />
            </div>
            {isCollapsed && (
              <div className={cn("absolute inset-x-0 top-0 flex items-center justify-center", onItemClick ? "h-20" : "h-24")}>
                <img src="/logo-small.png" alt="A" className="h-20 w-20 object-contain" />
              </div>
            )}
          </Link>
        </div>

        {/* Collapse Toggle Button - Desktop Only */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex absolute -right-3 top-28 w-6 h-6 rounded-full bg-background border border-border items-center justify-center shadow-sm z-50 hover:bg-accent transition-colors"
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-2 px-3 space-y-4 custom-scrollbar overflow-x-hidden">
          {/* Site Navigation */}
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 transition-opacity duration-300">
                Navigation
              </p>
            )}
            {USER_NAV_ITEMS.map((item) => renderLink(item))}
          </div>

          {/* Account / Dashboard */}
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 transition-opacity duration-300">
                My Account
              </p>
            )}
            {DASHBOARD_NAV_ITEMS.map((item) => renderLink(item))}
          </div>
        </div>

        {/* Footer */}
        <div className={cn("p-4 border-t border-border shrink-0 transition-all", isCollapsed && "px-2")}>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger render={
                <Button
                  variant="ghost"
                  className="w-full justify-center px-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  onClick={() => { handleLogout(); onItemClick?.(); }}
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                </Button>
              } />
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10"
              onClick={() => {
                handleLogout();
                onItemClick?.();
              }}
            >
              <LogOut className="h-4 w-4 shrink-0 mr-2" />
              <span>Logout</span>
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
