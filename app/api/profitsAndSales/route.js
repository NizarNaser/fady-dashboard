import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Expense from '@/lib/models/Expense';
import Product from '@/lib/models/Product';

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    await connectDB();

    // جلب المبيعات بين تاريخين
    const sales = await Expense.find({
      date: {
        $gte: new Date(from),
        $lte: new Date(to),
      },
    })
      .populate('product')
      .sort({ date: 1 });

   // تجهيز البيانات للرسم البياني + الجدول
    const chartData = sales.map((sale) => {
      const costPrice = sale.product?.costPrice || 0; // التكلفة من المنتج
      const profit = (sale.totalPrice - (costPrice * sale.quantity));

      return {
        id: sale._id,
        date: sale.date.toISOString().split('T')[0],
        productName: sale.product?.name || 'غير معروف',
        quantity: sale.quantity,
        sales: sale.totalPrice,
        profit: profit,
      };
    });

    return NextResponse.json(chartData);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
