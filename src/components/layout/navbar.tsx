'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu, X, ShoppingBag, Bell, User, LogOut, LayoutDashboard, Shield, Settings } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { USER_NAV_ITEMS, DASHBOARD_NAV_ITEMS, MOBILE_NAV_ITEMS } from '@/constants/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';
import { NotificationCenter } from '../shared/notification-center';
import { useEffect } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { unreadCount, loadNotifications } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);

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
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="sticky top-0 z-[100] w-full bg-background/80 backdrop-blur-md border-b border-border"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-red to-brand-red-light flex items-center justify-center">
            <span className="text-white font-bold text-sm">AA</span>
          </div>
          <span className="vibe-heading text-xl font-bold hidden sm:block">
            Arachnids<span className="text-gradient">Ark</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {user?.role === 'admin' ? (
            <Link
              href="/admin"
              className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors ${pathname.startsWith('/admin')
                  ? 'text-brand-gold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
            >
              <span className="font-heading uppercase tracking-widest text-[10px] flex items-center gap-2">
                <Shield className="h-3 w-3" /> Admin Dashboard
              </span>
              {pathname.startsWith('/admin') && (
                <motion.div
                  layoutId="navbar-indicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-brand-gold rounded-full"
                />
              )}
            </Link>
          ) : (
            USER_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive
                      ? 'text-brand-gold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                >
                  <span className="font-heading uppercase tracking-widest text-[10px]">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-brand-gold rounded-full"
                    />
                  )}
                </Link>
              );
            })
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isAuthenticated && user ? (
            <>
              {/* Notifications */}
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

              {/* User Menu - Desktop Only */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative rounded-full border border-border overflow-hidden translate-y-[2px]" />}>
                    <Avatar className="transition-transform active:scale-95 after:hidden">
                      {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                      <AvatarFallback className="bg-brand-red text-white font-bold text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-background border-border shadow-2xl">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <p className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Dashboard</p>
                    {DASHBOARD_NAV_ITEMS.map((item) => (
                      <DropdownMenuItem key={item.href} render={<Link href={item.href} className="flex items-center cursor-pointer w-full" />}>
                        <item.icon className="mr-2 h-4 w-4" /> {item.label}
                      </DropdownMenuItem>
                    ))}
                    {user.role === 'admin' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem render={<Link href="/admin" className="flex items-center cursor-pointer w-full text-brand-gold" />}>
                          <Shield className="mr-2 h-4 w-4" /> Admin Panel
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-400 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-brand-red hover:bg-brand-red-light text-white">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="outline" size="icon" className="md:hidden border-border" />}>
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="glass border-l border-border w-72 flex flex-col p-0 overflow-hidden">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              
              <div className="p-6 border-b border-border bg-accent/20">
                {isAuthenticated && user ? (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border">
                      {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                      <AvatarFallback className="bg-brand-red text-white font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{user.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{user.role}</span>
                    </div>
                  </div>
                ) : (
                  <div className="vibe-heading text-lg font-bold">
                    Arachnids<span className="text-gradient">Ark</span>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-1">
                {/* Only show nav items NOT in the bottom bar */}
                {user?.role !== 'admin' && USER_NAV_ITEMS.filter(item => !MOBILE_NAV_ITEMS.some(m => m.href === item.href)).length > 0 && (
                  <>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2 px-2">More</p>
                    {USER_NAV_ITEMS.filter(item => !MOBILE_NAV_ITEMS.some(m => m.href === item.href)).map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${isActive
                              ? 'bg-brand-red/10 text-brand-gold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                            }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="font-heading text-xs uppercase tracking-widest">{item.label}</span>
                        </Link>
                      );
                    })}
                  </>
                )}

                {isAuthenticated && (
                  <>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-6 mb-2 px-2">Dashboard</p>
                    {/* Only show dashboard items NOT in the bottom bar */}
                    {DASHBOARD_NAV_ITEMS.filter(item => !MOBILE_NAV_ITEMS.some(m => m.href === item.href)).map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${pathname === item.href
                            ? 'bg-brand-red/10 text-brand-gold'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                          }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="font-heading text-xs uppercase tracking-widest">{item.label}</span>
                      </Link>
                    ))}
                    {user?.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${pathname.startsWith('/admin')
                            ? 'bg-brand-red/10 text-brand-gold'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                          }`}
                      >
                        <Shield className="h-4 w-4" />
                        <span className="font-heading text-xs uppercase tracking-widest text-brand-gold">Admin Panel</span>
                      </Link>
                    )}
                  </>
                )}
              </div>

              <div className="p-6 border-t border-border bg-accent/10">
                {isAuthenticated ? (
                  <Button 
                    variant="ghost" 
                    onClick={handleLogout} 
                    className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-400/10 px-3"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="font-heading text-xs uppercase tracking-widest">Logout</span>
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/login" onClick={() => setOpen(false)} className="w-full">
                      <Button variant="outline" className="w-full text-xs font-heading uppercase tracking-widest">Login</Button>
                    </Link>
                    <Link href="/signup" onClick={() => setOpen(false)} className="w-full">
                      <Button className="w-full bg-brand-red hover:bg-brand-red-light text-white text-xs font-heading uppercase tracking-widest">Sign Up</Button>
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
