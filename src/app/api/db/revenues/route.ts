import { connectDB } from '@/lib/mongoose';
import { RevenueModel } from '@/models';

export const dynamic = 'force-dynamic';

// GET /api/db/revenues
export async function GET() {
  try {
    await connectDB();
    const revenues = await RevenueModel.find({}).sort({ sourceCreatedAt: -1 }).lean();
    return Response.json(revenues);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
