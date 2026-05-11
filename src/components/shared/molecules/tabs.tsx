'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface TabOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface TabMoleculeProps {
  /** Array of tab options */
  options: TabOption[];
  /** Current active tab value */
  value: string;
  /** Callback when tab changes */
  onValueChange: (value: string) => void;
  /** Optional class for the container */
  className?: string;
  /** Optional class for the list */
  listClassName?: string;
  /** Optional class for individual tabs */
  tabClassName?: string;
  /** If true, the tabs will take full width */
  fullWidth?: boolean;
}

/**
 * Premium Tab Molecule.
 * Provides a high-end sliding tab interface with glassmorphism.
 */
export function TabMolecule({
  options,
  value,
  onValueChange,
  className,
  listClassName,
  tabClassName,
  fullWidth = false
}: TabMoleculeProps) {
  const [showLeftShade, setShowLeftShade] = React.useState(false);
  const [showRightShade, setShowRightShade] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const checkScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      setShowLeftShade(el.scrollLeft > 10);
      setShowRightShade(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
    }
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      checkScroll();
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [checkScroll, options]);

  return (
    <Tabs
      value={value}
      onValueChange={onValueChange}
      className={cn("w-full relative group/tabs-molecule", className)}
    >
      <div className="relative flex items-center justify-start w-full">
        {/* Left Shade */}
        <AnimatePresence>
          {showLeftShade && !fullWidth && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute left-0 top-0 bottom-0 w-16 z-20 pointer-events-none bg-gradient-to-r from-background via-background/80 to-transparent rounded-l-xl sm:rounded-l-full"
            />
          )}
        </AnimatePresence>

        <TabsList
          ref={scrollRef}
          className={cn(
            "bg-black/20 dark:bg-white/5 border border-border/50 p-1 gap-3 rounded-xl sm:rounded-full backdrop-blur-md flex items-center justify-start overflow-x-auto no-scrollbar touch-pan-x select-none relative w-full sm:w-fit",
            "pl-4 pr-4 sm:px-1", // Balanced padding for mobile scroll anchoring
            listClassName
          )}
        >
          {options.map((option, index) => {
            const isActive = value === option.value;

            return (
              <TabsTrigger
                key={option.value}
                value={option.value}
                className={cn(
                  "relative group/tab px-6 py-2 h-9 rounded-lg sm:rounded-full font-heading text-[10px] uppercase tracking-widest font-bold transition-all duration-300 outline-none flex-shrink-0",
                  "text-muted-foreground transition-colors duration-200",
                  "hover:text-foreground/80",
                  "data-active:text-white data-active:bg-brand-red data-active:hover:text-white shadow-none border-none",
                  fullWidth && "flex-1",
                  tabClassName
                )}
              >
                <div className="relative z-10 flex items-center justify-center">
                  {option.label}
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Right Shade */}
        <AnimatePresence>
          {showRightShade && !fullWidth && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute right-0 top-0 bottom-0 w-12 z-20 pointer-events-none bg-gradient-to-l from-background via-background/50 to-transparent rounded-r-xl sm:rounded-r-full"
            />
          )}
        </AnimatePresence>
      </div>
    </Tabs>
  );
}
