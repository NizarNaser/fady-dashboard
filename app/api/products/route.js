// app/api/products/route.js
import { connectDB } from '@/lib/config/mongodb';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
export async function GET() {
  await connectDB();
  const products = await Product.find().populate('category');
  return NextResponse.json(products);
}

export async function POST(req) {
    await connectDB();
    const body = await req.json();
  
    // تأكد أن body.image مصفوفة (حتى لو كانت صورة واحدة)
    const images = Array.isArray(body.images) ? body.images : body.images ? [body.images] : [];
  
    const product = await Product.create({
      ...body,
      images: images, // خزنها كمصفوفة
    });
  
    return NextResponse.json(product);
  }
  

  export async function DELETE(req) {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
  
    if (!id) return new Response('Product ID missing', { status: 400 });
  
    try {
      const product = await Product.findById(id);
      if (!product) return new Response('Product not found', { status: 404 });
  
      // ✅ حذف الصور من المجلد
      if (Array.isArray(product.images)) {
        for (const url of product.images) {
          const filename = url.split('/uploads/')[1];
          const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
  
          try {
            await fs.unlink(filePath);
            console.log(`✅ Deleted: ${filePath}`);
          } catch (err) {
            console.warn(`⚠️ Failed to delete ${filePath}:`, err.message);
          }
        }
      }
  
      await Product.findByIdAndDelete(id);
      return new Response('Product deleted', { status: 200 });
    } catch (err) {
      return new Response('Server error', { status: 500 });
    }
  }
  

  export async function PUT(req) {
    await connectDB();
    const { _id, name, price, images, category } = await req.json();
  
    try {
      const oldProduct = await Product.findById(_id);
  
      if (!oldProduct) {
        return NextResponse.json({ message: 'Product not found' }, { status: 404 });
      }
  
      // حذف الصور القديمة إذا تغيرت الصور
      const oldImages = oldProduct.images || [];
      const newImages = Array.isArray(images) ? images : [images];
  
      const removedImages = oldImages.filter(img => !newImages.includes(img));
  
      for (const url of removedImages) {
        const filename = url.split('/uploads/')[1];
        const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
  
        try {
          await fs.unlink(filePath);
          console.log(`🗑️ Deleted old image: ${filePath}`);
        } catch (err) {
          console.warn(`⚠️ Failed to delete old image ${filePath}:`, err.message);
        }
      }
  
      const updated = await Product.findByIdAndUpdate(
        _id,
        { name, price, images: newImages, category },
        { new: true }
      );
  
      return NextResponse.json(updated);
    } catch (err) {
      console.error('Error updating product:', err);
      return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
  }
  