'use client';

import React, {
  useEffect,
  useRef,
  CSSProperties,
  useCallback,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X as CloseIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export interface ModalProps {
  open?: boolean;
  isOpen?: boolean; // Backward compatibility
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void; // Backward compatibility
  children: React.ReactNode;
  className?: string;

  title?: React.ReactNode;
  description?: React.ReactNode;
  showHeader?: boolean;
  headerClassName?: string;
  titleClassName?: string;

  showCloseButton?: boolean;
  closeButtonClassName?: string;

  showFooter?: boolean;
  footerClassName?: string;

  primaryButtonText?: string;
  secondaryButtonText?: string;
  tertiaryButtonText?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  onTertiaryAction?: () => void;

  primaryButtonDisabled?: boolean;
  secondaryButtonDisabled?: boolean;
  tertiaryButtonDisabled?: boolean;
  primaryButtonLoading?: boolean;
  secondaryButtonLoading?: boolean;
  tertiaryButtonLoading?: boolean;

  primaryButtonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  secondaryButtonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  tertiaryButtonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";

  size?: 'small' | 'confirm' | 'default' | 'large' | 'extra-large' | 'full' | 'half-screen' | 'side-left' | 'side-right' | 'side-drawer-left' | 'side-drawer-right' | 'side-drawer' | 'large-screen' | 'extra-large-screen' | 'second-modal' | 'full-screen';
  variant?: any; // For backward compatibility
  align?: 'left' | 'center' | 'right';
  centerAlign?: boolean;
  showScroll?: boolean;
  secondModalWidth?: string;
  contentClassName?: string;

  enableBackdropClose?: boolean;
  enableEscapeClose?: boolean;
  onBeforeClose?: (source: 'backdrop' | 'escape' | 'close-button' | 'force') => boolean;
  autoFocusPrimaryButton?: boolean;

  dismissible?: boolean;

  customHeader?: React.ReactNode;
  header?: React.ReactNode;
  customFooter?: React.ReactNode;
  footer?: React.ReactNode;
  usePortal?: boolean;
  noPadding?: boolean; // Backward compatibility
}

// Must match the CSS transition duration used below.
const ANIM_MS = 300;

const Modal = React.forwardRef<
  HTMLDivElement,
  ModalProps
>(
  (
    {
      open: providedOpen,
      isOpen: providedIsOpen,
      onOpenChange: providedOnOpenChange,
      onClose: providedOnClose,
      children,
      className,

      title,
      description,
      showHeader = true,
      headerClassName,
      titleClassName,

      showCloseButton = true,
      closeButtonClassName,

      showFooter = true,
      footerClassName,

      primaryButtonText,
      secondaryButtonText,
      tertiaryButtonText,
      onPrimaryAction,
      onSecondaryAction,
      onTertiaryAction,

      primaryButtonDisabled = false,
      secondaryButtonDisabled = false,
      tertiaryButtonDisabled = false,
      primaryButtonLoading = false,
      secondaryButtonLoading = false,
      tertiaryButtonLoading = false,

      primaryButtonVariant = 'default',
      secondaryButtonVariant = 'outline',
      tertiaryButtonVariant = 'outline',

      size: providedSize = 'confirm',
      variant: providedVariant,
      align = 'left',
      centerAlign = false,
      showScroll = true,
      secondModalWidth,
      contentClassName = '',

      enableBackdropClose = true,
      enableEscapeClose = true,
      onBeforeClose,
      autoFocusPrimaryButton = false,

      customHeader,
      header: providedHeader,
      customFooter,
      footer: providedFooter,
      usePortal = true,
      noPadding = false,
      dismissible = true,
    },
    ref
  ) => {
    const isMobile = useIsMobile();
    const contentRef = useRef<HTMLDivElement>(null);

    const footer = providedFooter ?? customFooter;
    const header = providedHeader ?? customHeader;

    const finalEnableBackdropClose = enableBackdropClose && dismissible;
    const finalEnableEscapeClose = enableEscapeClose && dismissible;

    // Sync open state
    const open = providedOpen ?? providedIsOpen ?? false;
    const onOpenChange = useCallback((val: boolean) => {
      if (providedOnOpenChange) providedOnOpenChange(val);
      if (!val && providedOnClose) providedOnClose();
    }, [providedOnOpenChange, providedOnClose]);

    // Map variant to size for backward compatibility
    const size = (providedVariant || providedSize) as any;

    const [hasEverOpened, setHasEverOpened] = useState(open);
    const [isVisible, setIsVisible] = useState(open);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      if (open) {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
        setHasEverOpened(true);
        setIsVisible(true);
      } else {
        hideTimerRef.current = setTimeout(() => {
          hideTimerRef.current = null;
          setIsVisible(false);
        }, ANIM_MS);
      }
      return () => {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
      };
    }, [open]);

    const isOpen = open && isVisible;

    const handleClose = useCallback(
      (source: 'backdrop' | 'escape' | 'close-button' | 'force') => {
        if (source !== 'force' && onBeforeClose && !onBeforeClose(source as any)) return;
        if (!open) return;
        onOpenChange(false);
      },
      [open, onBeforeClose, onOpenChange]
    );

    const handleBackdropClose = useCallback(() => {
      if (finalEnableBackdropClose) handleClose('backdrop');
    }, [finalEnableBackdropClose, handleClose]);

    useEffect(() => {
      if (!open) return;
      const sw = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (sw > 0) document.body.style.paddingRight = `${sw}px`;
      return () => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      };
    }, [open]);

    useEffect(() => {
      if (!open) return;
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && finalEnableEscapeClose) {
          e.preventDefault();
          handleClose('escape');
        }
        if (e.key === 'Enter' && autoFocusPrimaryButton && onPrimaryAction) {
          e.preventDefault();
          onPrimaryAction();
        }
      };
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, enableEscapeClose, autoFocusPrimaryButton, onPrimaryAction, handleClose]);

    // Second-modal width logic
    const [calculatedSecondModalWidth, setCalculatedSecondModalWidth] = useState<string | null>('45vw');
    useEffect(() => {
      if (!open || size !== 'second-modal') return;
      try {
        const all = Array.from(document.querySelectorAll<HTMLElement>('.modal-content'));
        const cur = contentRef.current;
        if (!cur) return;
        const parent = all.find((el) => el !== cur);
        if (parent) {
          const { width } = parent.getBoundingClientRect();
          if (width > 0) {
            setCalculatedSecondModalWidth(`${Math.round(width * 0.8)}px`);
            return;
          }
        }
        setCalculatedSecondModalWidth('48vw');
      } catch {
        setCalculatedSecondModalWidth('48vw');
      }
    }, [open, size]);

    if (!hasEverOpened) return null;

    const isSideDrawer = size === 'side-drawer' || size === 'side-left' || size === 'side-right' || size === 'side-drawer-left' || size === 'side-drawer-right' || size === 'half-screen' || size === 'large-screen' || size === 'extra-large-screen' || size === 'second-modal';
    const isFullScreen = size === 'full-screen' || size === 'full';
    const isConfirm = !isSideDrawer && !isFullScreen;

    const T = `${ANIM_MS}ms ease`;

    const overlayStyle: CSSProperties = {
      transition: `opacity ${T}`,
      opacity: isOpen ? 1 : 0,
      pointerEvents: isOpen ? 'auto' : 'none',
    };

    const sideStyle: CSSProperties = {
      transition: `opacity ${T}, transform ${T}`,
      opacity: isOpen ? 1 : 0,
      transform: isOpen ? 'translateX(0)' : (size.includes('left') ? 'translateX(-100%)' : 'translateX(100%)'),
      pointerEvents: isOpen ? 'auto' : 'none',
      maxHeight: '100vh',
    };

    const confirmStyle: CSSProperties = {
      transition: `opacity ${T}, transform ${T}`,
      opacity: isOpen ? 1 : 0,
      transform: isOpen ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -52%) scale(0.95)',
      pointerEvents: isOpen ? 'auto' : 'none',
      maxHeight: showScroll ? 'calc(100vh - 2rem)' : 'auto',
      overflow: 'hidden',
      borderRadius: '24px',
    };

    const fullStyle: CSSProperties = {
      transition: `opacity ${T}, transform ${T}`,
      opacity: isOpen ? 1 : 0,
      transform: isOpen ? 'scale(1)' : 'scale(0.97)',
      pointerEvents: isOpen ? 'auto' : 'none',
      maxHeight: '100vh',
    };

    const sizeClasses: Record<string, string> = {
      confirm: 'w-[92vw] sm:w-[640px] max-w-[95vw]',
      small: 'w-[85vw] sm:w-[400px] max-w-[95vw]',
      default: 'w-[92vw] sm:w-[640px] max-w-[95vw]',
      large: 'w-[95vw] sm:w-[850px] max-w-[95vw]',
      'extra-large': 'w-[95vw] sm:w-[1150px] max-w-[95vw]',
      'side-drawer': 'w-[85vw] sm:w-[400px] h-full',
      'side-left': 'w-[80vw] sm:w-[320px] h-full left-0',
      'side-right': 'w-[80vw] sm:w-[320px] h-full right-0',
      'half-screen': 'w-[50vw] h-full right-0',
      'full-screen': 'w-full h-full inset-0',
      'full': 'w-full h-full inset-0',
    };

    const baseContent = cn(
      'fixed bg-background shadow-2xl modal-content glass border-border overflow-hidden',
      align === 'center' && 'text-center',
      align === 'right' && 'text-right',
      className
    );

    const widthClass = sizeClasses[size] || sizeClasses.confirm;

    const modalContent = (
      <div className='fixed inset-0 z-[9999]' style={{ pointerEvents: isVisible ? 'auto' : 'none' }}>
        <div className='fixed inset-0 bg-black/40 backdrop-blur-sm' style={overlayStyle} onClick={handleBackdropClose} />

        {isSideDrawer && (
          <div
            ref={(node) => {
              if (ref) { if (typeof ref === 'function') ref(node); else (ref as any).current = node; }
              contentRef.current = node as HTMLDivElement | null;
            }}
            className={cn('fixed top-0 h-full flex flex-col', widthClass, baseContent, size.includes('left') ? 'left-0' : 'right-0')}
            style={{
              ...sideStyle,
              width: size === 'second-modal' && !isMobile ? (secondModalWidth ?? calculatedSecondModalWidth ?? undefined) : undefined,
            }}
          >
            {renderHeader()}
            <div className={cn('flex-1 min-h-0', noPadding ? 'p-0' : 'p-6', showScroll ? 'overflow-y-auto' : 'overflow-hidden')} style={showScroll ? { scrollbarGutter: 'stable' } : undefined}>
              {children}
            </div>
            {renderFooter()}
          </div>
        )}

        {isFullScreen && (
          <div ref={ref} className={cn('fixed inset-0 flex flex-col', baseContent)} style={fullStyle}>
            {renderHeader()}
            <div className={cn('flex-1 flex flex-col min-h-0', noPadding ? 'p-0' : 'p-6')}>{children}</div>
            {renderFooter()}
          </div>
        )}

        {isConfirm && (
          <div ref={ref} className={cn('fixed left-[50%] top-[50%] border flex flex-col', widthClass, baseContent)} style={confirmStyle}>
            {renderHeader()}
            <div className={cn('flex-1 min-h-0', noPadding ? 'p-0' : 'p-6', showScroll ? 'overflow-y-auto' : 'overflow-hidden')} style={showScroll ? { scrollbarGutter: 'stable' } : undefined}>
              {children}
            </div>
            {renderFooter()}
          </div>
        )}
      </div>
    );

    function renderHeader() {
      if (!showHeader && !showCloseButton) return null;
      if (header) return <div className={cn('flex-shrink-0 border-b p-4 sm:p-6', headerClassName)}><div className='flex items-center justify-between gap-3'><div className='min-w-0 flex-1'>{header}</div>{renderCloseButton()}</div></div>;
      
      return (
        <div className={cn('flex-shrink-0 border-b p-4 sm:p-6', headerClassName)}>
          <div className='flex items-center justify-between gap-3'>
            <div className='min-w-0 flex-1'>
              {title && <h2 className={cn('text-lg font-bold tracking-tight', titleClassName)}>{title}</h2>}
              {description && <p className='text-sm text-muted-foreground mt-1'>{description}</p>}
            </div>
            {renderCloseButton()}
          </div>
        </div>
      );
    }

    function renderFooter() {
      const has = footer || primaryButtonText || secondaryButtonText || tertiaryButtonText;
      if (!showFooter || !has) return null;
      return (
        <div className={cn('flex-shrink-0 border-t p-4 sm:px-6 sm:py-4 bg-card z-10', footerClassName)}>
          {footer || (
            <div className='flex gap-3 justify-end'>
              {tertiaryButtonText && <Button variant={tertiaryButtonVariant} onClick={onTertiaryAction} disabled={tertiaryButtonDisabled} loading={tertiaryButtonLoading}>{tertiaryButtonText}</Button>}
              {secondaryButtonText && <Button variant={secondaryButtonVariant} onClick={onSecondaryAction} disabled={secondaryButtonDisabled} loading={secondaryButtonLoading}>{secondaryButtonText}</Button>}
              {primaryButtonText && <Button variant={primaryButtonVariant} onClick={onPrimaryAction} disabled={primaryButtonDisabled} loading={primaryButtonLoading} autoFocus={autoFocusPrimaryButton}>{primaryButtonText}</Button>}
            </div>
          )}
        </div>
      );
    }

    function renderCloseButton() {
      if (!showCloseButton) return null;
      return (
        <button
          type='button'
          onClick={() => handleClose('close-button')}
          className={cn('rounded-full h-8 w-8 flex items-center justify-center shrink-0 transition-all hover:bg-muted active:scale-95 focus:outline-none', closeButtonClassName)}
        >
          <CloseIcon className='h-4 w-4' />
        </button>
      );
    }

    if (usePortal && typeof document !== 'undefined') {
      return createPortal(modalContent, document.body);
    }

    return modalContent;
  }
);

Modal.displayName = 'Modal';

export { Modal };
