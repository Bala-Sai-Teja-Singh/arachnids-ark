import type { OrderStatus, EnrollmentStatus, BookingStatus } from '@/types';

export const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
  awaiting_payment: { label: 'Awaiting Payment', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  payment_verified: { label: 'Payment Verified', color: 'text-green-400', bgColor: 'bg-green-400/10' },
  order_shipped: { label: 'Order Shipped', color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
  order_completed: { label: 'Order Completed', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  order_cancelled: { label: 'Order Cancelled', color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
};

export const ENROLLMENT_STATUS_CONFIG: Record<EnrollmentStatus, { label: string; color: string; bgColor: string }> = {
  enrolled: { label: 'Enrolled', color: 'text-green-400', bgColor: 'bg-green-400/10' },
  cancelled: { label: 'Cancelled', color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
};

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bgColor: string }> = {
  payment_verified: { label: 'Payment Verified', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  scheduled: { label: 'Scheduled', color: 'text-green-400', bgColor: 'bg-green-400/10' },
  completed: { label: 'Completed', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  cancelled: { label: 'Cancelled', color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
};

export const ALL_STATUSES: OrderStatus[] = [
  'pending', 'awaiting_payment', 'payment_verified', 'order_shipped', 'order_completed', 'order_cancelled'
];

export const ALL_ENROLLMENT_STATUSES: EnrollmentStatus[] = [
  'enrolled', 'cancelled'
];

export const ALL_BOOKING_STATUSES: BookingStatus[] = [
  'payment_verified', 'scheduled', 'completed', 'cancelled'
];
