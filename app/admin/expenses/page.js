'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiTrash2 } from "react-icons/fi";

export default function ExpensePage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({
    categoryId: '',
    productId: '',
    quantity: 1,
  });

  // جلب الكاتيغوريز
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    }
  };

  // جلب المنتجات
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    }
  };

  // جلب الصادرات
  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch {
      setExpenses([]);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchExpenses();
  }, []);

  // إضافة صادر
  const handleAddExpense = async () => {
    if (!form.productId) return toast.error("Bitte Produkt auswählen");
    if (!form.quantity || form.quantity <= 0)
      return toast.error("Bitte eine gültige Menge eingeben");

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: form.productId,
          quantity: form.quantity,
          categoryId: form.categoryId, // ← إرسال الـ categoryId للـ API
        }),
      });
      if (!res.ok) return toast.error("Fehler beim Hinzufügen");
      const data = await res.json();
      toast.success("Ausgabe erfolgreich hinzugefügt");
      setExpenses(prev => [...prev, data]); // ← استخدم البيانات القادمة من الـ API
      setForm({ categoryId: '', productId: '', quantity: 1 });
    } catch {
      toast.error("Fehler beim Hinzufügen");
    }
  };

  // حذف صادر
  const handleDelete = async (id) => {
    if (!window.confirm("Sind Sie sicher, dass Sie löschen möchten?")) return;
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setExpenses((prev) => prev.filter((exp) => exp._id !== id));
        toast.success("Erfolgreich gelöscht");
      } else {
        toast.error("Fehler beim Löschen");
      }
    } catch {
      toast.error("Fehler beim Löschen");
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-3xl font-bold mb-6 border-b pb-3"> Ausgabenverwaltung </h1>

      {/* فورم إضافة الصادرات */}
      <div className="grid gap-4 mb-6">
        <select
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Kategorie auswählen --</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>

        <select
          value={form.productId}
          onChange={(e) => setForm({ ...form, productId: e.target.value })}
          className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Produkt auswählen --</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} — €{(Number(p.price) || 0).toFixed(2)}
            </option>
          ))}
        </select>

        <input
          type="number"
          min={1}
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) })}
          className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
          placeholder="Menge"
        />

        <button
          onClick={handleAddExpense}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          ➕ Hinzufügen
        </button>
      </div>

      {/* جدول الصادرات */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border-b text-left">Kategorie</th>
              <th className="px-4 py-2 border-b text-left">Artikel</th>
              <th className="px-4 py-2 border-b text-left">Menge</th>
              <th className="px-4 py-2 border-b text-left">Gesamt (€)</th>
              <th className="px-4 py-2 border-b text-left">Datum</th>
              <th className="px-4 py-2 border-b text-left">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 && (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">Keine Daten</td>
              </tr>
            )}
            {expenses.map((exp) => (
              <tr key={exp._id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-b">{exp.category || 'Keine'}</td>
                <td className="px-4 py-2 border-b">{exp.product?.name || 'Unbekannt'}</td>
                <td className="px-4 py-2 border-b">{exp.quantity}</td>
                <td className="px-4 py-2 border-b">€{(Number(exp.totalPrice) || 0).toFixed(2)}</td>
                <td className="px-4 py-2 border-b">
                  {exp.date ? new Date(exp.date).toLocaleDateString('ar-EG') : '--'}
                </td>
                <td className="px-4 py-2 border-b text-center">
                  <button
                    onClick={() => handleDelete(exp._id)}
                    className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition"
                  >
                    <FiTrash2 /> löschen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
