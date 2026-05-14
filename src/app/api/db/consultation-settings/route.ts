import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import { ConsultationSettingsModel } from '@/models';

export const dynamic = 'force-dynamic';

// GET /api/db/consultation-settings — fetch the singleton
export async function GET() {
  try {
    await connectDB();
    const settings = await ConsultationSettingsModel.findOne({ _id: 'default' });
    if (!settings) return Response.json(null);
    return Response.json(settings.toJSON());
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/db/consultation-settings — update (upsert) the singleton
export async function PATCH(request: Request) {
  try {
    await connectDB();
    const updates = await request.json();
    const settings = await ConsultationSettingsModel.findByIdAndUpdate(
      'default',
      updates,
      { new: true, upsert: true, runValidators: true }
    );
    return Response.json(settings.toJSON());
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/db/consultation-settings — create/replace (for seeding)
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const settings = await ConsultationSettingsModel.findByIdAndUpdate(
      'default',
      body,
      { new: true, upsert: true }
    );
    return Response.json(settings.toJSON(), { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
