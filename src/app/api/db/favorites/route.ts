import { connectDB } from '@/lib/mongoose';
import { FavoriteModel } from '@/models';
import { type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 });
    }

    const favorites = await FavoriteModel.find({ userId }).sort({ createdAt: -1 });
    return Response.json(favorites);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    // We use targetId and userId to find existing or create new
    const existing = await FavoriteModel.findOne({ 
      userId: body.userId, 
      targetId: body.targetId 
    });

    if (existing) {
      return Response.json(existing);
    }

    const favorite = await FavoriteModel.create(body);
    return Response.json(favorite, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
