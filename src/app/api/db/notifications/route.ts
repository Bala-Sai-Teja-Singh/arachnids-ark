import { connectDB } from '@/lib/mongoose';
import { NotificationModel } from '@/models';
import { type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/db/notifications — filter by userId
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const userId = request.nextUrl.searchParams.get('userId');

    const filter: Record<string, any> = {};
    if (userId) filter.userId = userId;

    const notifications = await NotificationModel.find(filter).sort({ createdAt: -1 });
    return Response.json(notifications.map(n => n.toJSON()));
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/db/notifications — create notification
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const notification = await NotificationModel.create({ _id: body.id, ...body });
    return Response.json(notification.toJSON(), { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/db/notifications — bulk update (mark all as read, etc.)
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const { userId, action } = await request.json();

    if (action === 'markAllRead' && userId) {
      await NotificationModel.updateMany({ userId, read: false }, { read: true });
      return Response.json({ success: true });
    }

    if (action === 'clearAll' && userId) {
      await NotificationModel.deleteMany({ userId });
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
