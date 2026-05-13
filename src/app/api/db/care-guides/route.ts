import { connectDB } from '@/lib/mongoose';
import { CareGuideModel } from '@/models';

export const dynamic = 'force-dynamic';

// GET /api/db/care-guides
export async function GET() {
  try {
    await connectDB();
    const guides = await CareGuideModel.find();
    return Response.json(guides.map(g => g.toJSON()));
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/db/care-guides
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const guide = await CareGuideModel.create({ _id: body.id, ...body });
    return Response.json(guide.toJSON(), { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
