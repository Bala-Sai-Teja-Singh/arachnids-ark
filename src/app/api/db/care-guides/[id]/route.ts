import { connectDB } from '@/lib/mongoose';
import { CareGuideModel } from '@/models';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const guide = await CareGuideModel.findById(id);
    if (!guide) return Response.json({ error: 'Care guide not found' }, { status: 404 });
    return Response.json(guide.toJSON());
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const updates = await request.json();
    const guide = await CareGuideModel.findByIdAndUpdate(id, updates, { new: true });
    if (!guide) return Response.json({ error: 'Care guide not found' }, { status: 404 });
    return Response.json(guide.toJSON());
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const guide = await CareGuideModel.findByIdAndDelete(id);
    if (!guide) return Response.json({ error: 'Care guide not found' }, { status: 404 });
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
