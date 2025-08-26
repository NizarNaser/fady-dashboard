"use client";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

export default function StatsPage() {
  const [chartData, setChartData] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [printJS, setPrintJS] = useState(null);

  useEffect(() => {
    import("print-js").then((module) => setPrintJS(() => module.default));
  }, []);

  const fetchData = async () => {
    if (!fromDate || !toDate) return;
    try {
      const salesRes = await fetch(`/api/sales?from=${fromDate}&to=${toDate}`);
      const expensesRes = await fetch(`/api/expenses?from=${fromDate}&to=${toDate}`);
      const salesData = await salesRes.json();
      const expensesData = await expensesRes.json();

      // دمج البيانات مع تحديد النوع
      const combinedData = [
        ...salesData.map(s => ({ ...s, type: 'sale' })),
        ...expensesData.map(e => ({ ...e, type: 'expense' }))
      ];

      setChartData(combinedData);
    } catch (error) {
      console.error(error);
      toast.error("Beim Abrufen der Daten ist ein Fehler aufgetreten.");
    }
  };

  const exportToExcel = () => {
    if (chartData.length === 0) return toast.error("Keine Exportdaten");
    const ws = XLSX.utils.json_to_sheet(chartData.map(d => ({
      Datum: new Date(d.date).toLocaleDateString(),
      Typ: d.type === 'sale' ? 'Verkauf' : 'Ausgabe',
      Produkt: d.product?.name || '-',
      Kategorie: d.category?.name || '-',
      Preis: d.product?.price || 0,
      Menge: d.quantity,
      Gesamt: d.totalPrice
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Statistics");
    XLSX.writeFile(wb, "stats.xlsx");
  };

  const handlePrint = () => {
    if (!printJS) return toast.error("Die Printbibliothek ist noch nicht fertig.");
    if (chartData.length === 0) return toast.error("Keine Daten zum Drucken");
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

  // حساب الإجماليات
  const totalSales = chartData.filter(d => d.type === 'sale').reduce((acc, curr) => acc + curr.totalPrice, 0);
  const totalExpenses = chartData.filter(d => d.type === 'expense').reduce((acc, curr) => acc + curr.totalPrice, 0);
  const totalProfit = totalSales - totalExpenses;

  // تجهيز بيانات الرسم البياني اليومي
  const dailyData = {};
  chartData.forEach(d => {
    const day = new Date(d.date).toLocaleDateString();
    if (!dailyData[day]) dailyData[day] = { date: day, sales: 0, expenses: 0, profit: 0 };
    if (d.type === 'sale') dailyData[day].sales += d.totalPrice;
    else dailyData[day].expenses += d.totalPrice;
  });
  Object.values(dailyData).forEach(d => d.profit = d.sales - d.expenses);

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      {/* البطاقات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 no-print">
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-green-700">Gesamtumsatz</h3>
          <p className="text-2xl font-bold mt-1">{totalSales.toFixed(2)} €</p>
        </div>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-red-700">Gesamtausgaben</h3>
          <p className="text-2xl font-bold mt-1">{totalExpenses.toFixed(2)} €</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-blue-700">Gesamtgewinn</h3>
          <p className="text-2xl font-bold mt-1">{totalProfit.toFixed(2)} €</p>
        </div>
      </div>

      {/* الفلاتر + أزرار */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 no-print">
        <h1 className="text-xl font-bold">📊 Umsatz- und Gewinnstatistiken</h1>
        <div className="flex gap-2 flex-wrap">
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border rounded px-3 py-1" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border rounded px-3 py-1" />
          <button onClick={fetchData} className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700">Filtern</button>
          <button onClick={exportToExcel} className="bg-green-600 text-white px-4 py-1.5 rounded hover:bg-green-700">📥 Excel</button>
          <button onClick={handlePrint} className="bg-purple-600 text-white px-4 py-1.5 rounded hover:bg-purple-700">🖨 drucken / PDF</button>
        </div>
      </div>

      <div id="printable-content" className="mt-4">
        {/* الرسم البياني */}
        <div className="h-80 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={Object.values(dailyData)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#16a34a" name="Verkäufe" />
              <Line type="monotone" dataKey="expenses" stroke="#dc2626" name="Kosten" />
              <Line type="monotone" dataKey="profit" stroke="#2563eb" name="Gewinne" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* الجدول */}
        <table className="w-full mt-6 border border-gray-200 text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="border p-2">Datum</th>
              <th className="border p-2">Typ</th>
              <th className="border p-2">Produkt</th>
              <th className="border p-2">Kategorie</th>
              <th className="border p-2">Preis (€)</th>
              <th className="border p-2">Menge</th>
              <th className="border p-2">Gesamt (€)</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 text-center">
                <td className="border p-2">{new Date(row.date).toLocaleDateString()}</td>
                <td className="border p-2">{row.type === 'sale' ? 'Verkauf' : 'Ausgabe'}</td>
                <td className="border p-2">{row.product?.name || '-'}</td>
                <td className="border p-2">{row.category?.name || '-'}</td>
                <td className="border p-2">{row.product?.price || 0}</td>
                <td className="border p-2">{row.quantity}</td>
                <td className="border p-2">{row.totalPrice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
