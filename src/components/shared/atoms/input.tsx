'use client';

import React, {
  useEffect,
  useRef,
  useState,
} from 'react';
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import type { InputProps } from './Input.types';

const Input = React.forwardRef<
  HTMLInputElement,
  InputProps
>(
  (
    {
      name = 'input',
      className,
      disabled = false,
      errorMessage,
      iconClassName,
      label,
      labelClassName,
      labelTooltip,
      labelPlacement = 'outside',
      value,
      isClearable = false,
      onClear = () => {},
      onClose,
      type,
      refInput = null,
      startContent,
      endContent,
      allowedChars,
      regex, // New prop for custom regex validation
      startPaddingClass,
      endPaddingClass,
      extraClassName,
      loading,
      
      // Compatibility with old Input atom
      leftIcon,
      rightIcon,
      error,
      helperText,
      ...props
    },
    ref
  ) => {
    const inputRef =
      useRef<HTMLInputElement>(null);
    const combinedRef = (refInput ||
      inputRef) as React.RefObject<HTMLInputElement>;

    // Map compatibility props
    const effectiveStartContent = startContent || leftIcon;
    const effectiveEndContent = endContent || rightIcon;
    const effectiveErrorMessage = errorMessage || (error ? helperText : undefined);

    const getCharRegex = (
      allowedChars: string
    ) => {
      switch (allowedChars) {
        case 'alphabets':
          return /^[A-Za-z\s\-'\.]*$/; // Allow letters, spaces, hyphens, apostrophes, dots
        case 'numbers':
          return /^[0-9]*$/;
        case 'alphanumeric':
          return /^[A-Za-z0-9\s\-]*$/; // Allow letters, numbers, spaces, hyphens
        default:
          return null;
      }
    };

    const validateInput = (
      inputValue: string
    ): string => {
      let validatedValue = inputValue;

      // Priority 1: Custom regex validation (if provided)
      if (regex) {
        // Allow empty string to enable clearing
        if (inputValue === '') {
          return '';
        }
        if (!regex.test(inputValue)) {
          // If regex doesn't match, keep the previous valid value
          return localValue?.toString() || '';
        }
        return inputValue;
      }

      // Priority 2: allowedChars validation (if no regex provided)
      if (
        allowedChars &&
        allowedChars !== 'all'
      ) {
        const charRegex =
          getCharRegex(allowedChars);
        if (
          charRegex &&
          !charRegex.test(inputValue)
        ) {
          // Remove invalid characters
          validatedValue = inputValue.replace(
            allowedChars === 'alphabets'
              ? /[^A-Za-z\s\-'\.]/g
              : allowedChars === 'numbers'
                ? /[^0-9]/g
                : allowedChars === 'alphanumeric'
                  ? /[^A-Za-z0-9\s\-]/g
                  : /(?!)/g,
            ''
          );
        }
      }

      return validatedValue;
    };

    const handleClear = () => {
      onClear();
      if (combinedRef && combinedRef.current) {
        combinedRef.current.value = '';
      }
      setLocalValue('');
    };

    const [localValue, setLocalValue] =
      useState(value);
    useEffect(() => {
      setLocalValue(value ?? '');
    }, [value]);

    const isPasswordField = type === 'password';
    const [showPassword, setShowPassword] =
      useState(false);

    const effectiveType = isPasswordField
      ? showPassword
        ? 'text'
        : 'password'
      : type;

    return (
      <div className={cn("w-full", extraClassName)}>
        <div
          className={cn(
            'flex flex-col input-label-wrapper mb-0 ',
            labelPlacement === 'inside'
              ? ' file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm aria-invalid:border-destructive'
              : '',
            labelPlacement === 'left'
              ? 'flex-row items-center w-full'
              : ''
          )}
          data-slot='input'
        >
          {label && (
            <div
              className={cn(
                'flex items-center gap-2',
                labelPlacement === 'inside'
                  ? ' h-fit'
                  : labelPlacement === 'left'
                    ? 'self-center min-w-[100px] flex-shrink-0'
                    : 'mb-1'
              )}
            >
              <div className='flex items-center gap-1'>
                <label
                  htmlFor={name}
                  className={cn(
                    'text-sm pl-2 font-semibold whitespace-nowrap',
                    labelClassName
                  )}
                  dangerouslySetInnerHTML={{
                    __html: label,
                  }}
                />
                {labelTooltip && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="cursor-help text-muted-foreground">?</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {labelTooltip}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              {effectiveErrorMessage && (
                <span className='text-xs font-normal text-destructive'>
                  {effectiveErrorMessage}
                </span>
              )}
            </div>
          )}
          
          {!label && effectiveErrorMessage && (
             <p className="text-[10px] font-medium leading-none px-1 text-destructive mb-1">
               {effectiveErrorMessage}
             </p>
          )}

          <div className='relative w-full'>
            {/* Start Content */}
            {effectiveStartContent ? (
              <span
                className={cn(
                  'absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground',
                  iconClassName
                )}
              >
                {effectiveStartContent}
              </span>
            ) : null}

            {/* Input Field */}
            <input
              aria-label={label || 'Input'}
              ref={ref || combinedRef}
              id={name}
              disabled={disabled}
              type={effectiveType}
              data-slot='input'
              aria-invalid={
                effectiveErrorMessage ? true : false
              }
              onBlur={(e) => {
                props.onBlur?.(e);
                onClose?.();
              }}
              onKeyDown={(e) => {
                props.onKeyDown?.(e);
                if (e.key === 'Escape') onClose?.();
              }}
              onWheel={(e) => {
                props.onWheel?.(e);
                if (effectiveType === 'number') {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className={cn(
                'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                `${label && labelPlacement === 'inside' ? 'border-none h-fit !shadow-none' : ''}`,
                // Padding adjustments based on content
                effectiveStartContent
                  ? startPaddingClass || 'pl-10'
                  : 'pl-3',
                effectiveEndContent ||
                  isClearable ||
                  isPasswordField
                  ? endPaddingClass || 'pr-10'
                  : 'pr-3',
                className
              )}
              style={{
                borderColor: effectiveErrorMessage
                  ? 'hsl(var(--destructive))'
                  : undefined,
                borderWidth: effectiveErrorMessage
                  ? '2px'
                  : undefined,
                boxShadow: effectiveErrorMessage
                  ? '0 0 0 1px hsl(var(--destructive) / 0.2)'
                  : undefined,
              }}
              name={name}
              {...props}
              value={
                (value as any) ?? localValue ?? ''
              }
              onChange={(e) => {
                const inputValue =
                  e.target.value ?? '';
                const validatedValue =
                  regex ||
                  (allowedChars &&
                    allowedChars !== 'all')
                    ? validateInput(inputValue)
                    : inputValue;

                const currentValue =
                  (value as any) ??
                  localValue ??
                  '';

                setLocalValue(validatedValue);

                // Don't fire onChange if the value didn't actually change
                // (e.g. when allowedChars strips invalid chars, leaving same value)
                if (
                  validatedValue === currentValue
                ) {
                  return;
                }

                if (props.onChange) {
                  const syntheticEvent = {
                    ...e,
                    target: {
                      ...e.target,
                      value: validatedValue,
                      name,
                    },
                    currentTarget: {
                      ...e.currentTarget,
                      value: validatedValue,
                      name,
                    },
                  } as unknown as React.ChangeEvent<HTMLInputElement>;
                  props.onChange(syntheticEvent);
                }
              }}
            />

            {/* End Content */}
            {loading ? (
              <span
                className={cn(
                  'absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground',
                  iconClassName
                )}
              >
                <Loader2 className="h-4 w-4 animate-spin" />
              </span>
            ) : effectiveEndContent ? (
              <span
                className={cn(
                  'absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground',
                  iconClassName
                )}
              >
                {effectiveEndContent}
              </span>
            ) : null}

            {/* Password Toggle (eye icon) */}
            {isPasswordField && !effectiveEndContent ? (
              <button
                type='button'
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
                className={cn(
                  'absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground',
                  iconClassName
                )}
                onClick={() =>
                  setShowPassword((v) => !v)
                }
                disabled={disabled}
              >
                {showPassword ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>
            ) : null}

            {/* Clear Button (only shows when no endContent and conditions are met) */}
            {isClearable &&
            !disabled &&
            !effectiveEndContent &&
            localValue?.toString()?.length ? (
              <span
                aria-label='Clear'
                role='button'
                className={cn(
                  'absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer',
                  iconClassName
                )}
                onClick={handleClear}
              >
                <X size={14} />
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
