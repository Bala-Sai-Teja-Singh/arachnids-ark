import { connectDB } from '@/lib/mongoose';
import { CourseModel } from '@/models';

// GET /api/db/courses/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const course = await CourseModel.findById(id);
    if (!course) return Response.json({ error: 'Course not found' }, { status: 404 });
    return Response.json(course.toJSON());
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/db/courses/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const updates = await request.json();
    const course = await CourseModel.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!course) return Response.json({ error: 'Course not found' }, { status: 404 });
    return Response.json(course.toJSON());
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/db/courses/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const course = await CourseModel.findByIdAndDelete(id);
    if (!course) return Response.json({ error: 'Course not found' }, { status: 404 });
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
