import { connectDB } from '@/lib/config/mongodb';
import Sale from '@/lib/models/Sale';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category'; // إذا احتجنا
import { NextResponse } from 'next/server';

export async function GET() {
  await connectDB();
  // عمل populate للمنتج
  const sales = await Sale.find().populate('product');
  return NextResponse.json(sales);
}

export async function POST(req) {
  await connectDB();
  const { productId, quantity, categoryId } = await req.json();

  const product = await Product.findById(productId);
  if (!product) return NextResponse.json({ message: 'Product not found' }, { status: 404 });

  let categoryName = '';
  if (categoryId) {
    const category = await Category.findById(categoryId);
    if (category) categoryName = category.name;
  }

  const totalPrice = product.price * quantity;

  // إنشاء البيع
  const sale = await Sale.create({
    product: productId,
    quantity,
    totalPrice,
    category: categoryName,
  });

  // إعادة البيع مع populate للمنتج مباشرة
  const populatedSale = await Sale.findById(sale._id).populate('product');

  return NextResponse.json(populatedSale);
}

export async function DELETE(req) {
  await connectDB();
  const id = new URL(req.url).searchParams.get('id');
  await Sale.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
