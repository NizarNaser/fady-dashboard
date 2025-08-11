// app/api/categories/route.js
import  {connectDB}  from '@/lib/config/mongodb';
import Category from '@/lib/models/Category';
import { NextResponse } from 'next/server';

export async function GET() {
  await connectDB();
  const categories = await Category.find().sort({ createdAt: -1 });
  return NextResponse.json(categories);
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const category = await Category.create({ name: body.name });
  return NextResponse.json(category);
}

export async function DELETE(req) {
  await connectDB();
  const id = new URL(req.url).searchParams.get('id');
  await Category.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
