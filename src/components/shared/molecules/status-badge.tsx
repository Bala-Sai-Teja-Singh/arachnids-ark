'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { STATUS_CONFIG, ENROLLMENT_STATUS_CONFIG, BOOKING_STATUS_CONFIG } from '@/constants/statuses';
import { cn } from '@/lib/utils';
import type { OrderStatus, EnrollmentStatus, BookingStatus } from '@/types';

/**
 * Universal StatusBadge molecule.
 * Consolidates status display logic across orders, enrollments, and bookings.
 */
export type StatusType = 'order' | 'enrollment' | 'booking';

export interface StatusBadgeProps {
  /** The status value from the database */
  status: OrderStatus | EnrollmentStatus | BookingStatus | string;
  /** The type of entity (defaults to 'order') */
  type?: StatusType;
  /** Optional custom class name */
  className?: string;
}

export function StatusBadge({ 
  status, 
  type = 'order', 
  className 
}: StatusBadgeProps) {
  
  // Resolve the correct configuration based on type and status
  let config: { label: string; color: string; bgColor: string } | undefined;

  switch (type) {
    case 'enrollment':
      config = ENROLLMENT_STATUS_CONFIG[status as EnrollmentStatus];
      break;
    case 'booking':
      config = BOOKING_STATUS_CONFIG[status as BookingStatus];
      break;
    case 'order':
    default:
      config = STATUS_CONFIG[status as OrderStatus];
      break;
  }

  // Fallback for unknown statuses (safe default)
  if (!config) {
    config = {
      label: status.toString().replace(/_/g, ' '),
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/10'
    };
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent font-medium uppercase tracking-[0.1em] text-[10px] px-2.5 py-0.5 rounded-full animate-in fade-in zoom-in duration-300",
        config.bgColor,
        config.color,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
