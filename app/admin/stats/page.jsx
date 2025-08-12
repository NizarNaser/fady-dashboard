"use client";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as XLSX from "xlsx";
import toast from "react-hot-toast"; // قد تحتاج إلى تثبيتها إذا لم تكن موجودة

export default function StatsPage() {
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [chartData, setChartData] = useState([]);
  const [printJS, setPrintJS] = useState(null);

  // استيراد مكتبة print-js بشكل ديناميكي
  useEffect(() => {
    import('print-js').then((module) => {
      setPrintJS(() => module.default);
    });
  }, []);

  const fetchData = async () => {
    if (!fromDate || !toDate) return;
    try {
      const salesRes = await fetch(`/api/sales?from=${fromDate}&to=${toDate}`);
      const expensesRes = await fetch(`/api/expenses?from=${fromDate}&to=${toDate}`);
      const salesData = await salesRes.json();
      const expensesData = await expensesRes.json();

      setSales(salesData);
      setExpenses(expensesData);

      const combined = {};
      salesData.forEach(s => {
        const date = new Date(s.date).toLocaleDateString();
        combined[date] = combined[date] || { date, sales: 0, expenses: 0 };
        combined[date].sales += s.totalPrice;
      });
      expensesData.forEach(e => {
        const date = new Date(e.date).toLocaleDateString();
        combined[date] = combined[date] || { date, sales: 0, expenses: 0 };
        combined[date].expenses += e.totalPrice;
      });
      setChartData(Object.values(combined).map(d => ({ ...d, profit: d.sales - d.expenses })));
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء جلب البيانات');
    }
  };

  const exportToExcel = () => {
    if (chartData.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(chartData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Statistics");
    XLSX.writeFile(wb, "stats.xlsx");
  };

  const handlePrint = () => {
    if (!printJS) {
      toast.error('مكتبة الطباعة غير جاهزة بعد.');
      return;
    }
    if (chartData.length === 0) {
        toast.error('لا توجد بيانات للطباعة');
        return;
    }
    printJS({
      printable: 'printable-content',
      type: 'html',
      style: `
        @media print {
          .no-print {
            display: none !important;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th, td {
            border: 1px solid black !important;
            padding: 8px;
            font-size: 12px; /* لتقليل حجم الخط عند الطباعة */
          }
        }
      `,
    });
  };

  useEffect(() => {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    setFromDate(lastMonth.toISOString().split("T")[0]);
    setToDate(today.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (fromDate && toDate) fetchData();
  }, [fromDate, toDate]);

  // حساب الإجماليات
  const totalSales = chartData.reduce((acc, curr) => acc + curr.sales, 0);
  const totalExpenses = chartData.reduce((acc, curr) => acc + curr.expenses, 0);
  const totalProfit = totalSales - totalExpenses;

  return (
    <div className="p-6">
      {/* البطاقات الإحصائية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 no-print">
        <div className="bg-green-100 text-green-800 p-4 rounded shadow">
          <h3 className="text-xl font-semibold mb-2">إجمالي المبيعات</h3>
          <p className="text-2xl">{totalSales.toFixed(2)} €</p>
        </div>
        <div className="bg-red-100 text-red-800 p-4 rounded shadow">
          <h3 className="text-xl font-semibold mb-2">إجمالي المصاريف</h3>
          <p className="text-2xl">{totalExpenses.toFixed(2)} €</p>
        </div>
        <div className="bg-blue-100 text-blue-800 p-4 rounded shadow">
          <h3 className="text-xl font-semibold mb-2">إجمالي الربح</h3>
          <p className="text-2xl">{totalProfit.toFixed(2)} €</p>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-4">📊 إحصائيات المبيعات والأرباح</h1>

      <div className="flex gap-2 mb-4 no-print">
        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border px-2 py-1" />
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border px-2 py-1" />
        <button onClick={fetchData} className="bg-blue-500 text-white px-4 py-2 rounded">عرض</button>
        <button onClick={exportToExcel} className="bg-green-500 text-white px-4 py-2 rounded">📥 Excel</button>
        <button onClick={handlePrint} className="bg-purple-500 text-white px-4 py-2 rounded">🖨 طباعة / PDF</button>
      </div>

      <div id="printable-content">
        <h2 className="text-lg font-bold mb-2">تقرير الإحصائيات</h2>
        {fromDate && <p>من: {new Date(fromDate).toLocaleDateString('ar-EG')}</p>}
        {toDate && <p>إلى: {new Date(toDate).toLocaleDateString('ar-EG')}</p>}
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#4CAF50" name="المبيعات" />
              <Line type="monotone" dataKey="expenses" stroke="#F44336" name="المصاريف" />
              <Line type="monotone" dataKey="profit" stroke="#2196F3" name="الأرباح" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <table className="w-full mt-6 border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">التاريخ</th>
              <th className="border p-2">المبيعات (€)</th>
              <th className="border p-2">المصاريف (€)</th>
              <th className="border p-2">الأرباح (€)</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((row, idx) => (
              <tr key={idx}>
                <td className="border p-2">{row.date}</td>
                <td className="border p-2">{row.sales}</td>
                <td className="border p-2">{row.expenses}</td>
                <td className="border p-2">{row.profit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
