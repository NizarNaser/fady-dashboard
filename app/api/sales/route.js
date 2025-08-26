import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Sale from '@/lib/models/Sale';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
}

// GET: جلب كل المبيعات مع populate
export async function GET(req) {
  try {
    await connectDB();
    const sales = await Sale.find({})
      .populate('product')
      .populate({ path: 'category', select: 'name' })
      .sort({ date: 1 });

    return NextResponse.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST: إضافة بيع جديد
export async function POST(req) {
  try {
    await connectDB();
    const { productId, categoryId, quantity } = await req.json();

    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: "Produkt und Menge erforderlich" }, { status: 400 });
    }

    const product = await Product.findById(productId);
    if (!product) return NextResponse.json({ error: "Produkt nicht gefunden" }, { status: 404 });

    const totalPrice = product.price * quantity;

    const sale = await Sale.create({
      product: productId,
      category: categoryId || null,
      quantity,
      totalPrice,
    });

    const populatedSale = await Sale.findById(sale._id)
      .populate('product')
      .populate({ path: 'category', select: 'name' });

    return NextResponse.json(populatedSale, { status: 201 });
  } catch (error) {
    console.error("POST /api/sales error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

// DELETE: حذف بيع
export async function DELETE(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "ID erforderlich" }, { status: 400 });

    await Sale.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/sales error:", error);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}
