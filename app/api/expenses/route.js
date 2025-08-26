import { connectDB } from '@/lib/config/mongodb';
import Expense from '@/lib/models/Expense';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category'; // ← مهم
import { NextResponse } from 'next/server';

export async function GET() {
  await connectDB();
  const expenses = await Expense.find().populate('product');
  return NextResponse.json(expenses);
}

export async function POST(req) {
  await connectDB();
  const { productId, quantity, categoryId } = await req.json();

  const product = await Product.findById(productId);
  if (!product) return NextResponse.json({ message: 'Product not found' }, { status: 404 });

  let categoryName = '';
  if (categoryId) {
    const category = await Category.findById(categoryId); // ← استدعاء الكاتيغوري
    if (category) categoryName = category.name;
  }

  const totalPrice = product.price * quantity;

  const expense = await Expense.create({
    product: productId,
    quantity,
    totalPrice,
    category: categoryName, // ← تخزين اسم الكاتيغوري في قاعدة البيانات
  });

  return NextResponse.json(expense);
}

export async function DELETE(req) {
  await connectDB();
  const id = new URL(req.url).searchParams.get('id');
  await Expense.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
