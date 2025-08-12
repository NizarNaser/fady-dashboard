import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Sale from '@/lib/models/Sale';
import Expense from '@/lib/models/Expense';

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
    let from = searchParams.get('from');
    let to = searchParams.get('to');

    // إذا ما فيه تاريخ، نعرض آخر شهر
    if (!from || !to) {
      const now = new Date();
      to = now.toISOString().split('T')[0];
      const lastMonth = new Date();
      lastMonth.setMonth(now.getMonth() - 1);
      from = lastMonth.toISOString().split('T')[0];
    }

    await connectDB();

    // جلب المبيعات
    const sales = await Sale.find({
      date: { $gte: new Date(from), $lte: new Date(to) },
    }).sort({ date: 1 });

    // جلب المصروفات
    const expenses = await Expense.find({
      date: { $gte: new Date(from), $lte: new Date(to) },
    }).sort({ date: 1 });

    // تجهيز بيانات الرسم البياني اليومية
    const daysMap = {};

    sales.forEach((sale) => {
      const day = sale.date.toISOString().split('T')[0];
      if (!daysMap[day]) {
        daysMap[day] = { date: day, sales: 0, expenses: 0, profit: 0 };
      }
      daysMap[day].sales += sale.totalPrice;
    });

    expenses.forEach((expense) => {
      const day = expense.date.toISOString().split('T')[0];
      if (!daysMap[day]) {
        daysMap[day] = { date: day, sales: 0, expenses: 0, profit: 0 };
      }
      daysMap[day].expenses += expense.totalPrice;
    });

    // حساب الربح
    Object.values(daysMap).forEach((d) => {
      d.profit = d.sales - d.expenses;
    });

    // تحويل البيانات لمصفوفة مرتبة
    const chartData = Object.values(daysMap).sort((a, b) => new Date(a.date) - new Date(b.date));

    return NextResponse.json(chartData);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
