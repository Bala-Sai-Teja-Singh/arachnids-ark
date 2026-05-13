import { connectDB } from '@/lib/mongoose';
import { BookingModel } from '@/models';

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
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
