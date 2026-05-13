import { connectDB } from '@/lib/mongoose';
import { UserModel } from '@/models';

// GET /api/db/users/[id] — fetch user by ID
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const user = await UserModel.findById(id);
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
    return Response.json(user.toJSON());
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/db/users/[id] — update user
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const updates = await request.json();

    // Don't allow direct password updates through this route — use /password
    delete updates.password;

    const user = await UserModel.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
    return Response.json(user.toJSON());
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/db/users/[id] — delete user
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const user = await UserModel.findByIdAndDelete(id);
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
