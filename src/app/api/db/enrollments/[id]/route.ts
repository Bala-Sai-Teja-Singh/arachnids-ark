import { connectDB } from '@/lib/mongoose';
import { EnrollmentModel, RevenueModel } from '@/models';
import { syncRevenue } from '@/lib/revenue-sync';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const enrollment = await EnrollmentModel.findById(id);
    if (!enrollment) return Response.json({ error: 'Enrollment not found' }, { status: 404 });
    return Response.json(enrollment.toJSON());
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const updates = await request.json();
    const enrollment = await EnrollmentModel.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!enrollment) return Response.json({ error: 'Enrollment not found' }, { status: 404 });
    
    // Sync revenue
    await syncRevenue(enrollment._id, 'enrollment', enrollment.totalPrice, enrollment.status, enrollment.createdAt, enrollment.userName, enrollment.userEmail, enrollment.courseTitle, enrollment.orderId);
    
    return Response.json(enrollment.toJSON());
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const enrollment = await EnrollmentModel.findByIdAndDelete(id);
    if (!enrollment) return Response.json({ error: 'Enrollment not found' }, { status: 404 });
    
    // Remove from revenue tracking
    await RevenueModel.findByIdAndDelete(id);
    
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
