import { connectDB } from '@/lib/config/mongodb';
import Expense from '@/lib/models/Expense';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';
import { NextResponse } from 'next/server';

export async function GET(req) {
  await connectDB();

  const expenses = await Expense.find()
    .populate('product')
    .populate('category')
    .sort({ date: -1 });

  return NextResponse.json(expenses);
}

export async function POST(req) {
  try {
    await connectDB();
    const { productId, quantity, categoryId } = await req.json();

    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: "Produkt und Menge erforderlich" }, { status: 400 });
    }

    const product = await Product.findById(productId).populate('category');
    if (!product) return NextResponse.json({ error: "Produkt nicht gefunden" }, { status: 404 });

    let categoryToStore = null;
    if (categoryId) {
      const cat = await Category.findById(categoryId);
      if (cat) categoryToStore = cat._id;
    } else if (product.category) {
      categoryToStore = product.category._id;
    }

    const totalPrice = (Number(product.price) || 0) * Number(quantity);

    const expense = await Expense.create({
      product: product._id,
      quantity,
      totalPrice,
      ...(categoryToStore && { category: categoryToStore }),
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate('product')
      .populate('category');

    return NextResponse.json(populatedExpense, { status: 201 });
  } catch (error) {
    console.error("POST /api/expenses error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connectDB();
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: "ID fehlt" }, { status: 400 });

    await Expense.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/expenses error:", error);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}
