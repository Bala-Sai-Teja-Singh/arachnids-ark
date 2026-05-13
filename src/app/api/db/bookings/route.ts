import { connectDB } from '@/lib/mongoose';
import { BookingModel } from '@/models';
import { type NextRequest } from 'next/server';

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
    return Response.json(booking.toJSON(), { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
