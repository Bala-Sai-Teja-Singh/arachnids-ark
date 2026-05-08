'use client';

import { Badge } from '@/components/ui/badge';
import { STATUS_CONFIG } from '@/constants/statuses';
import type { InquiryStatus } from '@/types';

interface StatusBadgeProps {
  status: InquiryStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={`${config.bgColor} ${config.color} border-transparent font-medium ${className || ''}`}
    >
      {config.label}
    </Badge>
  );
}
