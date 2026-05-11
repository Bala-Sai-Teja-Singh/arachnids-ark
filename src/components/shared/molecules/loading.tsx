'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  /** Optional text to display below the spinner */
  text?: string;
  /** Whether to fill the entire screen or just the parent container */
  fullScreen?: boolean;
  /** Custom class name for the container */
  className?: string;
  /** Size of the spinner: sm, md, lg */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Universal Loading molecule.
 * Provides a consistent loading state across the application.
 */
export function Loading({ 
  text = 'Loading...', 
  fullScreen = false, 
  className,
  size = 'md'
}: LoadingProps) {
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const containerClasses = cn(
    "flex flex-col items-center justify-center gap-3 p-8 animate-in fade-in duration-500",
    fullScreen ? "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" : "w-full h-full min-h-[200px]",
    className
  );

  return (
    <div className={containerClasses}>
      <Loader2 className={cn("text-brand-red animate-spin", sizeClasses[size])} />
      {text && (
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
