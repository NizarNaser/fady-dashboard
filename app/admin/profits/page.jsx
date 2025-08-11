"use client";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function ProfitsPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [data, setData] = useState([]);

  const fetchData = async () => {
    if (!fromDate || !toDate) return;
    try {
      const res = await fetch(`/api/profitsAndSales?from=${fromDate}&to=${toDate}`);
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error("خطأ في جلب البيانات", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate]);

  const totalSales = data.reduce((sum, item) => sum + item.sales, 0);
  const totalProfit = data.reduce((sum, item) => sum + item.profit, 0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📊 الأرباح والمبيعات</h1>

      {/* اختيار التاريخ */}
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block mb-1">من تاريخ:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border p-2 rounded"
          />
        </div>
        <div>
          <label className="block mb-1">إلى تاريخ:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border p-2 rounded"
          />
        </div>
      </div>

      {/* ملخص الأرقام */}
      <div className="flex gap-8 mb-6">
        <div className="bg-green-100 p-4 rounded shadow">
          <h2 className="font-bold">إجمالي المبيعات</h2>
          <p className="text-xl">{totalSales.toFixed(2)} $</p>
        </div>
        <div className="bg-blue-100 p-4 rounded shadow">
          <h2 className="font-bold">إجمالي الأرباح</h2>
          <p className="text-xl">{totalProfit.toFixed(2)} $</p>
        </div>
      </div>

      {/* الرسم البياني */}
      <div className="bg-white p-4 rounded shadow mb-8">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="sales" stroke="#8884d8" name="المبيعات" />
            <Line type="monotone" dataKey="profit" stroke="#82ca9d" name="الأرباح" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* جدول المبيعات */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-bold mb-4">📅 جدول المبيعات</h2>
        <table className="w-full border-collapse border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">التاريخ</th>
              <th className="border p-2">المنتج</th>
              <th className="border p-2">الكمية</th>
              <th className="border p-2">إجمالي السعر</th>
              <th className="border p-2">الربح</th>
            </tr>
          </thead>
          <tbody>
            {data.map((sale) => (
              <tr key={sale.id}>
                <td className="border p-2">{sale.date}</td>
                <td className="border p-2">{sale.productName}</td>
                <td className="border p-2">{sale.quantity}</td>
                <td className="border p-2">{sale.sales.toFixed(2)} $</td>
                <td className="border p-2">{sale.profit.toFixed(2)} $</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
