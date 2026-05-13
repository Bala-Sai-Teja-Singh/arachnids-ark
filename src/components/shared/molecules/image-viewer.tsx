'use client';

import React, { useState, useEffect } from 'react';
import { Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getProxiedImageUrl } from '@/lib/utils';
import { createPortal } from 'react-dom';

interface ImageViewerProps {
  /** The image source URL */
  src: string;
  /** Image alt text */
  alt?: string;
  /** Classes applied to the wrapper container */
  className?: string;
  /** Classes applied directly to the img tag */
  imageClassName?: string;
  /** Default is no-referrer to bypass CORS */
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  /** Eye icon size */
  iconSize?: number;
  /** Whether to show the dark hover overlay with the eye icon. Set to false if you are bringing your own overlay. */
  triggerOverlay?: boolean;
}

export function ImageViewer({ 
  src, 
  alt = "Image", 
  className, 
  imageClassName,
  referrerPolicy = "no-referrer",
  iconSize = 24,
  triggerOverlay = true
}: ImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const proxiedSrc = getProxiedImageUrl(src);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleModal = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <div 
        className={cn("relative group/viewer cursor-pointer overflow-hidden", className)}
        onClick={toggleModal}
      >
        <img 
          src={proxiedSrc} 
          alt={alt} 
          referrerPolicy={referrerPolicy}
          className={cn("w-full h-full object-cover", imageClassName)} 
        />
        
        {triggerOverlay && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/viewer:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
            <Eye size={iconSize} className="text-white drop-shadow-lg scale-50 group-hover/viewer:scale-100 transition-transform duration-300" />
          </div>
        )}
      </div>

      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-zoom-out"
                onClick={toggleModal}
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative z-10 w-[95vw] h-[95vh] flex items-center justify-center pointer-events-none"
              >
                <div className="relative w-full h-full flex items-center justify-center pointer-events-auto">
                  <img 
                    src={proxiedSrc} 
                    alt={alt} 
                    referrerPolicy={referrerPolicy}
                    className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/10 bg-black/50" 
                  />
                  
                  <button 
                    onClick={toggleModal}
                    className="absolute top-4 right-4 p-3 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md transition-all hover:scale-110 border border-white/20 shadow-xl"
                  >
                    <X size={24} />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
