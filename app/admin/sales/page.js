'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiTrash2 } from 'react-icons/fi';

export default function SalesPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
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

  // جلب المبيعات
  const fetchSales = async () => {
    try {
      const res = await fetch('/api/sales');
      const data = await res.json();
      setSales(Array.isArray(data) ? data : []);
    } catch {
      setSales([]);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchSales();
  }, []);

  // إضافة بيع
  const handleAddSale = async () => {
    if (!form.productId) return toast.error("Bitte Produkt auswählen");
    if (!form.quantity || form.quantity <= 0)
      return toast.error("Bitte eine gültige Menge eingeben");

    const selectedCategory = categories.find(cat => cat._id === form.categoryId);
    const categoryName = selectedCategory ? selectedCategory.name : '';

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: form.productId,
          quantity: form.quantity,
          categoryId: form.categoryId,
        }),
      });
      if (!res.ok) return toast.error("Fehler beim Hinzufügen");

      const data = await res.json();

      // إضافة الاسم المختار للكايغوري محليًا
      setSales(prev => [...prev, { ...data, category: categoryName }]);
      setForm({ categoryId: '', productId: '', quantity: 1 });
      toast.success("Verkauf erfolgreich hinzugefügt");
    } catch {
      toast.error("Fehler beim Hinzufügen");
    }
  };

  // حذف بيع
  const handleDelete = async (id) => {
    if (!window.confirm("Sind Sie sicher, dass Sie löschen möchten?")) return;
    try {
      const res = await fetch(`/api/sales?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSales(prev => prev.filter(s => s._id !== id));
        toast.success("Erfolgreich gelöscht");
      } else {
        toast.error("Fehler beim Löschen");
      }
    } catch {
      toast.error("Fehler beim Löschen");
    }
  };

  return (
    <div className="bg-white shadow rounded-xl p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 border-b pb-3">
        ➕ Neue Verkäufe hinzufügen
      </h1>

      <div className="grid gap-4">
        {/* اختيار الكاتيغوري */}
        <select
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Kategorie wählen --</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>

        {/* اختيار المنتج */}
        <select
          value={form.productId}
          onChange={(e) => setForm({ ...form, productId: e.target.value })}
          className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Produkt wählen --</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>{p.name} — €{p.price}</option>
          ))}
        </select>

        {/* كمية المنتج */}
        <input
          type="number"
          min={1}
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) })}
          className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
          placeholder="Menge"
        />

        <button
          onClick={handleAddSale}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          ➕ Hinzufügen
        </button>
      </div>

      {/* جدول المبيعات */}
      <div className="overflow-x-auto">
        <table className="w-full mt-6 border-collapse shadow-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="p-3 border">Produkt</th>
              <th className="p-3 border">Kategorie</th>
              <th className="p-3 border">Preis</th>
              <th className="p-3 border">Menge</th>
              <th className="p-3 border">Gesamtpreis</th>
              <th className="p-3 border">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 && (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">
                  Keine Daten
                </td>
              </tr>
            )}
            {sales.map((s) => (
              <tr key={s._id} className="text-center hover:bg-gray-50">
                <td className="border p-3">{s.product?.name || 'Keine'}</td>
                <td className="border p-3">{s.category || 'Keine'}</td>
                <td className="border p-3">{s.product?.price || 0}€</td>
                <td className="border p-3">{s.quantity}</td>
                <td className="border p-3">{s.totalPrice || 0}€</td>
                <td className="border p-3 space-x-2">
                  <button
                    onClick={() => handleDelete(s._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                  >
                    Löschen ❌
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
