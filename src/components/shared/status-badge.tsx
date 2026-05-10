'use client';

import { Badge } from '@/components/ui/badge';
import { STATUS_CONFIG, ENROLLMENT_STATUS_CONFIG, BOOKING_STATUS_CONFIG } from '@/constants/statuses';

interface StatusBadgeProps {
  status: any;
  type?: 'order' | 'enrollment' | 'booking';
  className?: string;
}

export function StatusBadge({ status, type = 'order', className }: StatusBadgeProps) {
  let config = (STATUS_CONFIG as any)[status];
  
  if (type === 'enrollment') config = (ENROLLMENT_STATUS_CONFIG as any)[status];
  if (type === 'booking') config = (BOOKING_STATUS_CONFIG as any)[status];
  
  if (!config) {
    if (type === 'enrollment') config = ENROLLMENT_STATUS_CONFIG.enrolled;
    else if (type === 'booking') config = BOOKING_STATUS_CONFIG.payment_verified;
    else config = STATUS_CONFIG.payment_verified;
  }

  return (
    <Badge
      variant="outline"
      className={`${config.bgColor} ${config.color} border-transparent font-medium ${className || ''}`}
    >
      {config.label}
    </Badge>
  );
}
