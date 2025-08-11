// app/api/sales/route.js
import { connectDB } from '@/lib/config/mongodb';
import Sale from '@/lib/models/Sale';
import Product from '@/lib/models/Product';
import { NextResponse } from 'next/server';

export async function GET() {
  await connectDB();
  const sales = await Sale.find().populate('product');
  return NextResponse.json(sales);
}

export async function POST(req) {
  await connectDB();
  const { productId, quantity } = await req.json();

  const product = await Product.findById(productId);
  if (!product) return NextResponse.json({ message: 'Product not found' }, { status: 404 });

  const totalPrice = product.price * quantity;

  const sale = await Sale.create({
    product: productId,
    quantity,
    totalPrice,
  });

  return NextResponse.json(sale);
}
export async function DELETE(req) {
    await connectDB();
    const id = new URL(req.url).searchParams.get('id');
    await Sale.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  }