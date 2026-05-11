'use client';

import * as React from 'react';
import { LucideIcon, Plus } from 'lucide-react';
import { Button } from '@/components/shared/atoms/button';
import { cn } from '@/lib/utils';

/**
 * Universal SectionHeader molecule.
 * Standardizes the "Title + Subtitle + Action Button" row used across admin/user pages.
 */
export interface SectionHeaderProps {
  /** The main section title */
  title?: string;
  /** Optional subtitle or description */
  description?: string;
  /** Optional primary action button configuration */
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  };
  /** Custom children (e.g. Search bars) */
  children?: React.ReactNode;
  /** Custom class name */
  className?: string;
}

export function SectionHeader({
  title,
  description,
  action,
  children,
  className
}: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-6", title ? "mb-8" : "mb-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>}
          {description && (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        {children}
        {action && (
          <Button
            variant={action.variant === 'primary' ? 'default' : (action.variant as any) || 'default'}
            onClick={action.onClick}
            leftIcon={action.icon ? <action.icon className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            className={cn(
              action.variant === 'primary' && "bg-brand-red hover:bg-brand-red/90 text-white shadow-lg shadow-brand-red/20 px-6"
            )}
          >
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
