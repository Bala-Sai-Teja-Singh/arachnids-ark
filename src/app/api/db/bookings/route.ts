import { connectDB } from '@/lib/mongoose';
import { BookingModel } from '@/models';
import { type NextRequest } from 'next/server';
import { syncRevenue } from '@/lib/revenue-sync';

export const dynamic = 'force-dynamic';

// GET /api/db/bookings — filter by userId
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const userId = request.nextUrl.searchParams.get('userId');

    const filter: Record<string, any> = {};
    if (userId) filter.userId = userId;

    const bookings = await BookingModel.find(filter).sort({ createdAt: -1 });
    return Response.json(bookings.map(b => b.toJSON()));
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/db/bookings
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const booking = await BookingModel.create({ _id: body.id, ...body });
    
    // Sync revenue
    const itemName = booking.items && booking.items.length > 0 
      ? (booking.items.length === 1 ? booking.items[0].label : `${booking.items.length} Sessions`) 
      : `${booking.duration} min Consultation`;
      
    await syncRevenue(
      booking._id, 
      'booking', 
      booking.totalPrice || 0, 
      booking.status, 
      booking.createdAt, 
      booking.userName, 
      booking.userEmail, 
      itemName,
      booking.orderId
    );

    return Response.json(booking.toJSON(), { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
