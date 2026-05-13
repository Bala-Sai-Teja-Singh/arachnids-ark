import { connectDB } from '@/lib/mongoose';
import { ReviewModel } from '@/models';
import { type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/db/reviews — filter by targetId, targetType, userId
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const targetId = searchParams.get('targetId');
    const targetType = searchParams.get('targetType');
    const userId = searchParams.get('userId');

    const filter: Record<string, any> = {};
    if (targetId) filter.targetId = targetId;
    if (targetType) filter.targetType = targetType;
    if (userId) filter.userId = userId;

    const reviews = await ReviewModel.find(filter).sort({ createdAt: -1 });
    return Response.json(reviews.map(r => r.toJSON()));
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/db/reviews
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const review = await ReviewModel.create({ _id: body.id, ...body });
    return Response.json(review.toJSON(), { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
