import type { ConsultationPricing, UrgencyMultiplier } from '@/types';

export const DEFAULT_CONSULTATION_PRICING: ConsultationPricing[] = [
  { duration: 15, basePrice: 499, label: '15 Minutes' },
  { duration: 30, basePrice: 899, label: '30 Minutes' },
  { duration: 60, basePrice: 1499, label: '60 Minutes' },
];

export const DEFAULT_URGENCY_MULTIPLIERS: UrgencyMultiplier[] = [
  { urgency: 'normal', multiplier: 1, label: 'Normal' },
  { urgency: 'priority', multiplier: 1.5, label: 'Priority' },
  { urgency: 'emergency', multiplier: 2, label: 'Emergency' },
];

export const CURRENCY_SYMBOL = '₹';

export function formatPrice(price: number): string {
  return `${CURRENCY_SYMBOL}${price.toLocaleString('en-IN')}`;
}

export function calculateConsultationPrice(
  basePrice: number,
  multiplier: number
): number {
  return Math.round(basePrice * multiplier);
}
