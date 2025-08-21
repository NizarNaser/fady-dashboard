'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPrinter, FiTrash2 } from "react-icons/fi";

export default function ExpensePage() {
  const [products, setProducts] = useState([]);
  const [expense, setExpense] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [printJS, setPrintJS] = useState(null);

  // تحميل print-js ديناميكيًا (عميل فقط)
  useEffect(() => {
    import('print-js').then((module) => {
      setPrintJS(() => module.default);
    });
  }, []);

  // جلب المنتجات
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) return setProducts([]);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    }
  };

  // جلب الصادرات (يفضل أن يكون فيها populate('product'))
  const fetchExpense = async () => {
    try {
      const res = await fetch('/api/expenses');
      if (!res.ok) {
        toast.error("Fehler beim Abrufen der Ausgaben");
        return setExpense([]);
      }
      const data = await res.json();
      setExpense(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Fehler beim Abrufen der Ausgaben");
      setExpense([]);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchExpense();
  }, []);

  // تصفية الصادرات
  const filteredExpense = expense.filter((exp) => {
    const expenseDate = exp?.date ? new Date(exp.date) : null;
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    const isWithinDate =
      (!from || (expenseDate && expenseDate >= from)) &&
      (!to || (expenseDate && expenseDate <= to));

    const isProductMatch =
      selectedProduct === 'all' || exp?.product?._id === selectedProduct; // ← حماية

    return isWithinDate && isProductMatch;
  });

  // إجمالي الصادرات
  const totalExpenseAmount = filteredExpense.reduce(
    (sum, exp) => sum + (Number(exp?.totalPrice) || 0),
    0
  );

  // إضافة عملية شراء (صادر)
  const addToExpense = async (productId) => {
    if (!productId) {
      toast.error("Ungültige Artikel-ID");
      return;
    }
    const quantity = parseInt(prompt('Menge eingeben:'), 10);
    if (!quantity || quantity <= 0) {
      toast.error("Bitte geben Sie eine gültige Menge ein");
      return;
    }

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        toast.error("Fehler beim Hinzufügen des Kaufs");
        return;
      }

      toast.success("Kauf erfolgreich hinzugefügt");
      await fetchExpense();
    } catch {
      toast.error("Fehler beim Hinzufügen des Kaufs");
    }
  };

  // حذف عملية
  const handleDelete = async (id) => {
    if (!window.confirm("Sind Sie sicher, dass Sie löschen möchten?")) return;
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setExpense((prev) => prev.filter((exp) => exp._id !== id));
        toast.success("Erfolgreich gelöscht");
      } else {
        toast.error("Fehler beim Löschen");
      }
    } catch {
      toast.error("Beim Löschen ist ein Fehler aufgetreten");
    }
  };

  // طباعة
  const handlePrint = () => {
    if (!printJS) {
      toast.error("Druckbibliothek noch nicht bereit");
      return;
    }
    if (filteredExpense.length === 0) {
      toast.error("Keine Daten zum Drucken");
      return;
    }
    printJS({
      printable: 'printable-content',
      type: 'html',
      style: `
        @media print {
          button, .no-print {
            display: none !important;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th, td {
            border: 1px solid black !important;
            padding: 8px;
          }
        }
      `,
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-3xl font-bold mb-6 border-b pb-3"> Ausgabenverwaltung</h1>

      {/* اختيار منتج للإضافة */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Produkt auswählen </h2>
        <div className="flex gap-4 items-center">
          <select
            className="p-3 border rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-green-500"
            onChange={(e) => addToExpense(e.target.value)}
          >
            <option value="">-- Produkt auswählen  --</option>
            {products.map((product) => (
              <option key={product?._id} value={product?._id}>
                {product?.name ?? 'Unbekannt '} — €
                {(Number(product?.price) || 0).toFixed(2)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* الفلاتر */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium">Von</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Bis</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Artikel</label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-400"
          >
            <option value="all">Alle</option>
            {products.map((p) => (
              <option key={p?._id} value={p?._id}>
                {p?.name ?? ' Unbekannt'}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <FiPrinter /> Drucken 
        </button>
      </div>

      {/* جدول الصادرات */}
      <div id="printable-content">
        <div className="mb-4">
          <h3 className="text-lg font-bold">Ausgabenbericht </h3>
          {fromDate && <p>Von: {new Date(fromDate).toLocaleDateString('ar-EG')}</p>}
          {toDate && <p>Bis: {new Date(toDate).toLocaleDateString('ar-EG')}</p>}
          {selectedProduct !== 'all' && (
            <p>
              Artikel: {products.find((p) => p?._id === selectedProduct)?.name || 'Unbekannt '}
            </p>
          )}
        </div>

        <h2 className="text-lg font-bold mb-3">
          Gesamtausgaben : €{totalExpenseAmount.toFixed(2)}
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border-b text-left">Artikel</th>
                <th className="px-4 py-2 border-b text-left">Menge</th>
                <th className="px-4 py-2 border-b text-left">Gesamt (€)</th>
                <th className="px-4 py-2 border-b text-left">das Datum</th>
                <th className="px-4 py-2 border-b text-left no-print">Verfahren</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpense.map((exp) => (
                <tr key={exp?._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b">{exp?.product?.name ?? ' Unbekannt'}</td>
                  <td className="px-4 py-2 border-b">{Number(exp?.quantity) || 0}</td>
                  <td className="px-4 py-2 border-b">
                    €{(Number(exp?.totalPrice) || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 border-b">
                    {exp?.date ? new Date(exp.date).toLocaleDateString('ar-EG') : '--'}
                  </td>
                  <td className="px-4 py-2 border-b no-print text-center">
                    <button
                      onClick={() => handleDelete(exp?._id)}
                      className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition"
                    >
                      <FiTrash2 /> löschen
                    </button>
                  </td>
                </tr>
              ))}
              {filteredExpense.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-500">
                    Keine Daten
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
