import { connectDB } from '@/lib/mongoose';
import { BookingModel, RevenueModel } from '@/models';
import { syncRevenue } from '@/lib/revenue-sync';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const booking = await BookingModel.findById(id);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });
    return Response.json(booking.toJSON());
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const updates = await request.json();
    const booking = await BookingModel.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });
    
    // Sync revenue
    const itemName = booking.items && booking.items.length > 0 
      ? (booking.items.length === 1 ? booking.items[0].label : `${booking.items.length} Sessions`) 
      : `${booking.duration} min Consultation`;
    await syncRevenue(booking._id, 'booking', booking.totalPrice || 0, booking.status, booking.createdAt, booking.userName, booking.userEmail, itemName, booking.orderId);
    
    return Response.json(booking.toJSON());
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const booking = await BookingModel.findByIdAndDelete(id);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });
    
    // Remove from revenue tracking
    await RevenueModel.findByIdAndDelete(id);
    
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
