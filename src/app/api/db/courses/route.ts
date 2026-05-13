import { connectDB } from '@/lib/mongoose';
import { CourseModel } from '@/models';

export const dynamic = 'force-dynamic';

// GET /api/db/courses
export async function GET() {
  try {
    await connectDB();
    const courses = await CourseModel.find().sort({ createdAt: -1 });
    return Response.json(courses.map(c => c.toJSON()));
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/db/courses
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const course = await CourseModel.create({ _id: body.id, ...body });
    return Response.json(course.toJSON(), { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
