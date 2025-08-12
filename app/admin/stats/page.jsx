"use client";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

export default function StatsPage() {
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [chartData, setChartData] = useState([]);
  const [printJS, setPrintJS] = useState(null);

  useEffect(() => {
    import("print-js").then((module) => {
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
      salesData.forEach((s) => {
        const date = new Date(s.date).toLocaleDateString();
        combined[date] = combined[date] || { date, sales: 0, expenses: 0 };
        combined[date].sales += s.totalPrice;
      });
      expensesData.forEach((e) => {
        const date = new Date(e.date).toLocaleDateString();
        combined[date] = combined[date] || { date, sales: 0, expenses: 0 };
        combined[date].expenses += e.totalPrice;
      });
      setChartData(Object.values(combined).map((d) => ({ ...d, profit: d.sales - d.expenses })));
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء جلب البيانات");
    }
  };

  const exportToExcel = () => {
    if (chartData.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(chartData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Statistics");
    XLSX.writeFile(wb, "stats.xlsx");
  };

  const handlePrint = () => {
    if (!printJS) {
      toast.error("مكتبة الطباعة غير جاهزة بعد.");
      return;
    }
    if (chartData.length === 0) {
      toast.error("لا توجد بيانات للطباعة");
      return;
    }
    printJS({
      printable: "printable-content",
      type: "html",
      style: `
        @media print {
          .no-print { display: none !important; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid black !important; padding: 6px; font-size: 12px; }
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

  const totalSales = chartData.reduce((acc, curr) => acc + curr.sales, 0);
  const totalExpenses = chartData.reduce((acc, curr) => acc + curr.expenses, 0);
  const totalProfit = totalSales - totalExpenses;

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      {/* البطاقات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 no-print">
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-green-700">إجمالي المبيعات</h3>
          <p className="text-2xl font-bold mt-1">{totalSales.toFixed(2)} €</p>
        </div>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-red-700">إجمالي المصاريف</h3>
          <p className="text-2xl font-bold mt-1">{totalExpenses.toFixed(2)} €</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-blue-700">إجمالي الربح</h3>
          <p className="text-2xl font-bold mt-1">{totalProfit.toFixed(2)} €</p>
        </div>
      </div>

      {/* العنوان + الفلاتر */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 no-print">
        <h1 className="text-xl font-bold">📊 إحصائيات المبيعات والأرباح</h1>
        <div className="flex gap-2 flex-wrap">
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border rounded px-3 py-1" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border rounded px-3 py-1" />
          <button onClick={fetchData} className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700">عرض</button>
          <button onClick={exportToExcel} className="bg-green-600 text-white px-4 py-1.5 rounded hover:bg-green-700">📥 Excel</button>
          <button onClick={handlePrint} className="bg-purple-600 text-white px-4 py-1.5 rounded hover:bg-purple-700">🖨 طباعة / PDF</button>
        </div>
      </div>

      {/* المحتوى القابل للطباعة */}
      <div id="printable-content" className="mt-4">
        <h2 className="text-lg font-semibold mb-2">تقرير الإحصائيات</h2>
        {fromDate && <p>من: {new Date(fromDate).toLocaleDateString("ar-EG")}</p>}
        {toDate && <p>إلى: {new Date(toDate).toLocaleDateString("ar-EG")}</p>}

        {/* الرسم البياني */}
        <div className="h-80 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#16a34a" name="المبيعات" />
              <Line type="monotone" dataKey="expenses" stroke="#dc2626" name="المصاريف" />
              <Line type="monotone" dataKey="profit" stroke="#2563eb" name="الأرباح" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* الجدول */}
        <table className="w-full mt-6 border border-gray-200 text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="border p-2">التاريخ</th>
              <th className="border p-2">المبيعات (€)</th>
              <th className="border p-2">المصاريف (€)</th>
              <th className="border p-2">الأرباح (€)</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
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
