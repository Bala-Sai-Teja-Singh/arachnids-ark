import { connectDB } from '@/lib/mongoose';
import { EnrollmentModel } from '@/models';
import { type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/db/enrollments — filter by userId and/or courseId
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');

    const filter: Record<string, any> = {};
    if (userId) filter.userId = userId;
    if (courseId) filter.courseId = courseId;

    const enrollments = await EnrollmentModel.find(filter).sort({ createdAt: -1 });
    return Response.json(enrollments.map(e => e.toJSON()));
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/db/enrollments
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const enrollment = await EnrollmentModel.create({ _id: body.id, ...body });
    return Response.json(enrollment.toJSON(), { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
