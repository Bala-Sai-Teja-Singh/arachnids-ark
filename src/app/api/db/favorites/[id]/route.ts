import { connectDB } from '@/lib/mongoose';
import { FavoriteModel } from '@/models';
import { type NextRequest } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // The ID could be the Mongo _id or we might want to delete by targetId + userId
    // But since the store has the ID after creation, deleting by ID is fine.
    // However, sometimes it's easier to delete by targetId.
    // I'll support both: if id starts with 'fav-', it's a targetId, otherwise it's _id.
    
    if (id.includes('-')) {
        // Assume it's a search for targetId if it's not a standard Mongo ID
        // but for simplicity, let's just use the query param userId if provided
        const userId = request.nextUrl.searchParams.get('userId');
        if (userId) {
            await FavoriteModel.deleteOne({ userId, targetId: id });
            return Response.json({ success: true });
        }
    }

    await FavoriteModel.findByIdAndDelete(id);
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
