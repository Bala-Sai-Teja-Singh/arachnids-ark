'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { NavItem, type NavItemProps } from '@/components/shared/molecules/nav-item';
import { Button } from '@/components/shared/atoms/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

/**
 * Universal Sidebar Organism.
 * Replaces separate AdminSidebar and UserSidebar.
 * Highly configurable via props.
 */
export interface SidebarSection {
  label?: string;
  items: Omit<NavItemProps, 'isCollapsed'>[];
}

export interface SidebarProps {
  /** Logo to display at the top (can be a component or image path) */
  logo?: React.ReactNode;
  /** Logo for collapsed state */
  smallLogo?: React.ReactNode;
  /** Navigation sections and items */
  sections: SidebarSection[];
  /** If true, the sidebar is in collapsed mode */
  isCollapsed: boolean;
  /** Callback to toggle collapse state */
  onToggleCollapse: () => void;
  /** Optional bottom action (e.g., Logout) */
  footerAction?: {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
  };
  /** Callback for when any item is clicked (useful for mobile) */
  onItemClick?: () => void;
  /** If true, the sidebar is being used in a mobile drawer */
  isMobile?: boolean;
}

export function Sidebar({
  logo,
  smallLogo,
  sections,
  isCollapsed,
  onToggleCollapse,
  footerAction,
  onItemClick,
  isMobile = false
}: SidebarProps) {
  return (
    <div className={cn(
      "flex flex-col h-full bg-card border-r border-border transition-all duration-300 relative group/sidebar z-40",
      isMobile ? "w-full" : (isCollapsed ? "w-20" : "w-64")
    )}>
      {/* Branding Section */}
      <div className={cn(
        "h-16 flex items-center border-b border-border/50 relative px-4",
        isMobile ? "justify-between" : "justify-center"
      )}>
        <Link href="/" className="transition-transform duration-300 hover:scale-110 scale-125 origin-left flex items-center">
          {isCollapsed ? (
            <div className="animate-in fade-in zoom-in duration-300 flex items-center justify-center h-full w-full">
              <div className="h-12 w-12 flex items-center justify-center">
                {smallLogo || <div className="h-10 w-10 bg-brand-gold rounded-xl rotate-12" />}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              {logo || <span className="text-2xl font-black tracking-tighter text-gradient">ARACHNIDSARK</span>}
            </div>
          )}
        </Link>

        {isMobile && (
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Close Sidebar"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Toggle Button (Visible on Hover in Desktop) */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-brand-gold text-black shadow-lg flex items-center justify-center opacity-0 group-hover/sidebar:opacity-100 transition-opacity z-[60] hidden md:flex border border-background"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-8 custom-scrollbar">
        {sections.map((section, idx) => (
          <div key={section.label || idx} className="space-y-2">
            {section.label && !isCollapsed && (
              <h4 className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 animate-in fade-in duration-500">
                {section.label}
              </h4>
            )}
            <nav className="space-y-1">
              {section.items.map((item) => (
                <NavItem
                  key={item.href}
                  {...item}
                  isCollapsed={isCollapsed}
                  onClick={() => {
                    item.onClick?.();
                    onItemClick?.();
                  }}
                />
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer Section */}
      {footerAction && (
        <div className="p-4 border-t border-border/50">
          <Button
            variant="ghost"
            onClick={footerAction.onClick}
            className={cn(
              "w-full justify-start text-muted-foreground hover:text-brand-red hover:bg-brand-red/5",
              isCollapsed && "justify-center px-0"
            )}
            leftIcon={<footerAction.icon className="h-5 w-5" />}
          >
            {!isCollapsed && <span className="ml-2">{footerAction.label}</span>}
          </Button>
        </div>
      )}
    </div>
  );
}
