import { connectDB } from '@/lib/mongoose';
import { UserModel } from '@/models';

// POST /api/db/users/login — authenticate user
export async function POST(request: Request) {
  try {
    await connectDB();
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Return user without password
    const { password: _, ...safeUser } = user.toJSON();
    return Response.json(safeUser);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
