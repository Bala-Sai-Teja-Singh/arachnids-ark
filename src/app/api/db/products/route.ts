import { connectDB } from '@/lib/mongoose';
import { ProductModel } from '@/models';
import { type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/db/products — fetch all products, with optional filters
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const mainCategory = searchParams.get('mainCategory');
    const featured = searchParams.get('featured');
    const visible = searchParams.get('isVisible');

    const filter: Record<string, any> = {};
    if (mainCategory) filter.mainCategory = mainCategory;
    if (featured === 'true') filter.featured = true;
    if (visible !== null) filter.isVisible = visible === 'true';

    const products = await ProductModel.find(filter).sort({ createdAt: -1 });
    return Response.json(products.map(p => p.toJSON()));
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/db/products — create a new product
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const product = await ProductModel.create({ _id: body.id, ...body });
    return Response.json(product.toJSON(), { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
