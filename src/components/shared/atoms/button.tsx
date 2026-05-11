'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button as ShadcnButton, type ButtonProps as ShadcnButtonProps } from '@/components/ui/button';

/**
 * Enhanced Button atom.
 * A highly customizable wrapper around Shadcn's Button with built-in loading states,
 * icon support, and requested callbacks.
 */
export interface ButtonProps extends ShadcnButtonProps {
  /** Shows a loading spinner and disables the button */
  isLoading?: boolean;
  /** Optional icon to display before the text */
  leftIcon?: React.ReactNode;
  /** Optional icon to display after the text */
  rightIcon?: React.ReactNode;
  /** If true, adds a subtle premium glow effect */
  premium?: boolean;
  /** Requested generic props for consistency across atoms */
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLButtonElement>) => void;
  onClear?: () => void;
  onClose?: () => void;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    isLoading,
    leftIcon,
    rightIcon,
    premium,
    children,
    disabled,
    variant,
    value: _value,
    onChange: _onChange,
    onClear: _onClear,
    onClose: _onClose,
    ...props
  }, ref) => {
    return (
      <ShadcnButton
        ref={ref}
        disabled={isLoading || disabled}
        variant={variant}
        value={_value}
        className={cn(
          "relative overflow-hidden transition-all duration-300 active:scale-95",
          premium && "shadow-[0_0_20px_-5px_rgba(246,173,85,0.3)] hover:shadow-[0_0_25px_-5px_rgba(246,173,85,0.5)]",
          className
        )}
        {...props}
      >
        {/* Loading Spinner */}
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
        )}

        {/* Left Icon */}
        {!isLoading && leftIcon && (
          <span className="mr-2 inline-flex shrink-0">{leftIcon}</span>
        )}

        {/* Button Content */}
        <span className="relative z-10">{children}</span>

        {/* Right Icon */}
        {!isLoading && rightIcon && (
          <span className="ml-2 inline-flex shrink-0">{rightIcon}</span>
        )}

        {/* Premium Shine Effect Layer */}
        {premium && (
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite]" />
        )}
      </ShadcnButton>
    );
  }
);

Button.displayName = 'Button';

export { Button };
