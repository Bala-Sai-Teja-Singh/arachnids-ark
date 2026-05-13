import { connectDB } from '@/lib/mongoose';
import { UserModel } from '@/models';

// PATCH /api/db/users/[id]/password — change password with verification
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return Response.json({ error: 'Both current and new password are required' }, { status: 400 });
    }

    const user = await UserModel.findById(id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return Response.json({ error: 'Incorrect current password' }, { status: 401 });
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
