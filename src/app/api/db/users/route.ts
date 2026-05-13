import { connectDB } from '@/lib/mongoose';
import { UserModel } from '@/models';
import { type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/db/users — fetch all users (admin) or filter by query params
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (email) {
      const user = await UserModel.findOne({ email: email.toLowerCase() });
      return Response.json(user ? [user.toJSON()] : []);
    }

    const users = await UserModel.find().sort({ createdAt: -1 });
    return Response.json(users.map(u => u.toJSON()));
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/db/users — create a new user
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    // Check for duplicate email
    const existing = await UserModel.findOne({ email: body.email?.toLowerCase() });
    if (existing) {
      return Response.json({ error: 'Email already registered' }, { status: 409 });
    }

    const user = new UserModel({ _id: body.id, ...body });
    await user.save(); // pre-save hook hashes password
    return Response.json(user.toJSON(), { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
