import { connectDB } from '@/lib/mongoose';
import { OrderModel, RevenueModel } from '@/models';
import { syncRevenue } from '@/lib/revenue-sync';

// GET /api/db/orders/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const order = await OrderModel.findById(id);
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    return Response.json(order.toJSON());
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/db/orders/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const updates = await request.json();
    const order = await OrderModel.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    
    // Sync revenue
    const itemName = order.items.length === 1 ? order.items[0].name : `${order.items.length} Items`;
    await syncRevenue(order._id, 'order', order.totalPrice, order.status, order.createdAt, order.userName, order.userEmail, itemName);
    
    return Response.json(order.toJSON());
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/db/orders/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const order = await OrderModel.findByIdAndDelete(id);
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    
    // Orphan any child revenues (enrollments/bookings) so they appear in the dashboard
    await RevenueModel.updateMany({ orderId: id }, { orderId: null });
    
    // Remove the main order revenue record
    await RevenueModel.findByIdAndDelete(id);
    
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
