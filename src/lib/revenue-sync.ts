import { RevenueModel } from '@/models';

type SourceType = 'order' | 'enrollment' | 'booking';

/**
 * Synchronizes a revenue record for a given source document.
 * This should be called whenever an order, enrollment, or booking status changes.
 */
export async function syncRevenue(
  sourceId: string,
  sourceType: SourceType,
  amount: number,
  status: string,
  sourceCreatedAt: string | Date,
  customerName?: string,
  customerEmail?: string,
  itemName?: string,
  orderId?: string
) {
  try {
    await RevenueModel.findOneAndUpdate(
      { _id: sourceId },
      {
        sourceType,
        amount,
        status,
        sourceCreatedAt: new Date(sourceCreatedAt),
        customerName: customerName || 'Unknown',
        customerEmail: customerEmail || 'Unknown',
        itemName: itemName || 'Multiple Items',
        orderId: orderId || null,
      },
      { upsert: true, new: true, runValidators: true }
    );
  } catch (error) {
    console.error(`Failed to sync revenue for ${sourceType} ${sourceId}:`, error);
  }
}
