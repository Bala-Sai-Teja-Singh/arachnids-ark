import { connectDB } from '@/lib/mongoose';
import { NotificationModel } from '@/models';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const updates = await request.json();
    const notification = await NotificationModel.findByIdAndUpdate(id, updates, { new: true });
    if (!notification) return Response.json({ error: 'Notification not found' }, { status: 404 });
    return Response.json(notification.toJSON());
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const notification = await NotificationModel.findByIdAndDelete(id);
    if (!notification) return Response.json({ error: 'Notification not found' }, { status: 404 });
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
