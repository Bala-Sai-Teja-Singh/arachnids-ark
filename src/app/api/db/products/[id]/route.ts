import { connectDB } from '@/lib/mongoose';
import { ProductModel } from '@/models';

// GET /api/db/products/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const product = await ProductModel.findById(id);
    if (!product) return Response.json({ error: 'Product not found' }, { status: 404 });
    return Response.json(product.toJSON());
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/db/products/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const updates = await request.json();
    const product = await ProductModel.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!product) return Response.json({ error: 'Product not found' }, { status: 404 });
    return Response.json(product.toJSON());
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/db/products/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const product = await ProductModel.findByIdAndDelete(id);
    if (!product) return Response.json({ error: 'Product not found' }, { status: 404 });
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
