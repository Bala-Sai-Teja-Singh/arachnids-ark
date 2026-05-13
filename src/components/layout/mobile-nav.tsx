'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { MOBILE_NAV_ITEMS } from '@/constants/navigation';
import { useModules } from '@/hooks/use-modules';

export function MobileNav() {
  const pathname = usePathname();
  const { isVisible } = useModules();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-center justify-around h-16 px-2">
        {MOBILE_NAV_ITEMS.filter(item => isVisible(item.module)).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-1 px-3 py-1"
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute -top-0.5 w-8 h-0.5 bg-brand-gold rounded-full"
                />
              )}
              <Icon className={`h-5 w-5 transition-colors ${
                isActive ? 'text-brand-gold' : 'text-muted-foreground'
              }`} />
              <span className={`text-[10px] font-medium transition-colors ${
                isActive ? 'text-brand-gold' : 'text-muted-foreground'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
