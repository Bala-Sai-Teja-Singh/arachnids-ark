import { connectDB } from '@/lib/mongoose';
import { UserModel } from '@/models';

// POST /api/db/users/check-email — check if email is available
export async function POST(request: Request) {
  try {
    await connectDB();
    const { email } = await request.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    return Response.json({ available: !existing });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
