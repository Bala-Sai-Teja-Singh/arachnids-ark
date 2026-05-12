'use client';

import * as React from 'react';
import { LucideIcon, SearchX } from 'lucide-react';
import { Button } from '@/components/shared/atoms/button';
import { cn } from '@/lib/utils';

/**
 * Universal EmptyState molecule.
 * Used when a search or filter returns no results, or a list is empty.
 */
export interface EmptyStateProps {
  /** The main message */
  title: string;
  /** Optional sub-message */
  description?: string;
  /** Optional Lucide icon */
  icon?: LucideIcon;
  /** Action button configuration or custom JSX */
  action?: {
    label: string;
    onClick: () => void;
  } | React.ReactNode;
  /** Custom class name */
  className?: string;
}

export function EmptyState({ 
  icon: Icon = SearchX, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-border/50 bg-accent/5",
      className
    )}>
      {Icon && (
        <div className="h-16 w-16 rounded-2xl bg-brand-red/10 flex items-center justify-center mb-6 animate-pulse">
          <Icon className="h-8 w-8 text-brand-red" />
        </div>
      )}
      <h3 className="text-xl font-bold tracking-tight mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-sm max-w-[300px] mb-8 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <>
          {React.isValidElement(action) ? (
            action
          ) : (
            <Button 
              onClick={() => {
                if (typeof action === 'object' && action !== null && 'onClick' in action) {
                  (action as { onClick: () => void }).onClick();
                }
              }} 
              className="bg-brand-red hover:bg-brand-red/90 text-white font-bold uppercase tracking-widest text-[11px] h-11 px-8 rounded-full shadow-lg shadow-brand-red/20"
            >
              {typeof action === 'object' && action !== null && 'label' in action ? (action as { label: string }).label : ''}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
