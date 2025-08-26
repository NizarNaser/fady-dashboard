'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiTrash2 } from "react-icons/fi";

export default function ExpensePage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ categoryId: '', productId: '', quantity: 1 });

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch { setCategories([]); }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch { setProducts([]); }
  };

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch { setExpenses([]); }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchExpenses();
  }, []);

  const handleAddExpense = async () => {
    if (!form.productId) return toast.error("Bitte Produkt auswählen");
    if (!form.quantity || form.quantity <= 0) return toast.error("Bitte eine gültige Menge eingeben");

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Fehler beim Hinzufügen");

      setExpenses(prev => [...prev, data]);
      toast.success("Ausgabe erfolgreich hinzugefügt");
      setForm({ categoryId: '', productId: '', quantity: 1 });
    } catch {
      toast.error("Fehler beim Hinzufügen");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Sind Sie sicher, dass Sie löschen möchten?")) return;

    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setExpenses(prev => prev.filter(exp => exp._id !== id));
        toast.success("Erfolgreich gelöscht");
      } else toast.error("Fehler beim Löschen");
    } catch { toast.error("Fehler beim Löschen"); }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-3xl font-bold mb-6 border-b pb-3"> Ausgabenverwaltung </h1>

      <div className="grid gap-4 mb-6">
        <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="border p-2 rounded">
          <option value="">-- Kategorie auswählen --</option>
          {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
        </select>

        <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="border p-2 rounded">
          <option value="">-- Produkt auswählen --</option>
          {products.map(p => <option key={p._id} value={p._id}>{p.name} — €{p.price}</option>)}
        </select>

        <input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) })} className="border p-2 rounded" placeholder="Menge" />

        <button onClick={handleAddExpense} className="bg-blue-600 text-white px-6 py-2 rounded-lg">➕ Hinzufügen</button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border-b">Kategorie</th>
              <th className="px-4 py-2 border-b">Produkt</th>
              <th className="px-4 py-2 border-b">Menge</th>
              <th className="px-4 py-2 border-b">Gesamt (€)</th>
              <th className="px-4 py-2 border-b">Datum</th>
              <th className="px-4 py-2 border-b">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 && <tr><td colSpan="6" className="p-4 text-center text-gray-500">Keine Daten</td></tr>}
            {expenses.map(exp => (
              <tr key={exp._id}>
                <td className="px-4 py-2 border-b">{exp.category?.name || 'Keine'}</td>
                <td className="px-4 py-2 border-b">{exp.product?.name || 'Unbekannt'}</td>
                <td className="px-4 py-2 border-b">{exp.quantity}</td>
                <td className="px-4 py-2 border-b">€{exp.totalPrice.toFixed(2)}</td>
                <td className="px-4 py-2 border-b">{exp.date ? new Date(exp.date).toLocaleDateString('ar-EG') : '--'}</td>
                <td className="px-4 py-2 border-b text-center">
                  <button onClick={() => handleDelete(exp._id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg flex items-center gap-1">
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
