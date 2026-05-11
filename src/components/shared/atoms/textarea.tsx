'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Textarea as ShadcnTextarea } from '@/components/ui/textarea';

/**
 * Enhanced Textarea atom.
 * A multi-line input field with support for error states and requested callbacks.
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** If true, applies error styling */
  error?: boolean;
  /** Optional helper text displayed below the textarea */
  helperText?: string;
  /** Callback triggered when the input is 'closed' (e.g., blur or Esc) */
  onClose?: () => void;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    error, 
    helperText, 
    onClose, 
    onBlur, 
    onKeyDown, 
    ...props 
  }, ref) => {

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      onBlur?.(e);
      onClose?.();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      onKeyDown?.(e);
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    return (
      <div className="w-full space-y-1.5">
        <ShadcnTextarea
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "min-h-[100px] transition-all duration-300 bg-background/50 border-border hover:border-brand-gold/50 focus-visible:ring-brand-gold/20 focus-visible:border-brand-gold resize-none",
            error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
            className
          )}
          ref={ref}
          {...props}
        />

        {/* Helper/Error Text */}
        {helperText && (
          <p className={cn(
            "text-[10px] font-medium leading-none px-1 transition-colors",
            error ? "text-destructive" : "text-muted-foreground"
          )}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
