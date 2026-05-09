import type { OrderStatus } from '@/types';

export const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
  awaiting_payment: { label: 'Awaiting Payment', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  payment_uploaded: { label: 'Payment Uploaded', color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
  verified: { label: 'Verified', color: 'text-green-400', bgColor: 'bg-green-400/10' },
  rejected: { label: 'Rejected', color: 'text-red-400', bgColor: 'bg-red-400/10' },
  confirmed: { label: 'Confirmed', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  completed: { label: 'Completed', color: 'text-brand-gold', bgColor: 'bg-brand-gold/10' },
  cancelled: { label: 'Cancelled', color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
};

export const ALL_STATUSES: OrderStatus[] = [
  'pending', 'awaiting_payment', 'payment_uploaded', 'verified',
  'rejected', 'confirmed', 'completed', 'cancelled'
];
