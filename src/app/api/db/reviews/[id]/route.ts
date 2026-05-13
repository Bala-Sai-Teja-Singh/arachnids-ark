import { connectDB } from '@/lib/mongoose';
import { ReviewModel } from '@/models';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const updates = await request.json();
    const review = await ReviewModel.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!review) return Response.json({ error: 'Review not found' }, { status: 404 });
    return Response.json(review.toJSON());
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const review = await ReviewModel.findByIdAndDelete(id);
    if (!review) return Response.json({ error: 'Review not found' }, { status: 404 });
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
