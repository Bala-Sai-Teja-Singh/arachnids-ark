import { connectDB } from '@/lib/mongoose';
import { SystemSettingsModel } from '@/models';

export const dynamic = 'force-dynamic';

// GET /api/db/system-settings — fetch the singleton settings document
export async function GET() {
  try {
    await connectDB();
    const settings = await SystemSettingsModel.findById('default');
    if (!settings) return Response.json(null);
    return Response.json(settings.toJSON());
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/db/system-settings — update (upsert) the singleton settings
export async function PATCH(request: Request) {
  try {
    await connectDB();
    const updates = await request.json();
    const settings = await SystemSettingsModel.findByIdAndUpdate(
      'default',
      updates,
      { new: true, upsert: true, runValidators: true }
    );
    return Response.json(settings.toJSON());
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/db/system-settings — create/replace settings (for seeding)
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const settings = await SystemSettingsModel.findByIdAndUpdate(
      'default',
      body,
      { new: true, upsert: true }
    );
    return Response.json(settings.toJSON(), { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
