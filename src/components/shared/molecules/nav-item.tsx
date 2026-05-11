'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Universal Navigation Item molecule.
 * Used in both user and admin sidebars. Supports active states, 
 * collapsed tooltips, and badges.
 */
export interface NavItemProps {
  /** Display label */
  label: string;
  /** Link href */
  href: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** If true, the parent sidebar is collapsed */
  isCollapsed?: boolean;
  /** Optional badge count or text */
  badge?: string | number;
  /** Callback for click events (e.g., closing mobile menu) */
  onClick?: () => void;
  /** Optional class for custom styling */
  className?: string;
}

export function NavItem({
  label,
  href,
  icon: Icon,
  isCollapsed,
  badge,
  onClick,
  className
}: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  const content = (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative",
        isActive 
          ? "bg-brand-gold/10 text-brand-gold shadow-[inset_0_0_10px_rgba(246,173,85,0.05)]" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        isCollapsed && "justify-center px-0",
        className
      )}
    >
      <Icon className={cn(
        "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
        isActive ? "text-brand-gold" : "text-muted-foreground group-hover:text-foreground"
      )} />
      
      {!isCollapsed && (
        <>
          <span className="text-sm font-medium">{label}</span>
          {badge !== undefined && (
            <span className="ml-auto bg-brand-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-in zoom-in">
              {badge}
            </span>
          )}
        </>
      )}

      {/* Active Indicator Dot */}
      {isActive && !isCollapsed && (
        <div className="absolute left-0 w-1 h-4 bg-brand-gold rounded-full" />
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={content} />
        <TooltipContent side="right" className="bg-brand-gold text-black font-bold border-none">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
