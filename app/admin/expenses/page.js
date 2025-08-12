'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPrinter, FiTrash2, FiPlus } from "react-icons/fi";

export default function ExpensePage() {
  const [products, setProducts] = useState([]);
  const [expense, setExpense] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [printJS, setPrintJS] = useState(null);

  useEffect(() => {
    import('print-js').then((module) => {
      setPrintJS(() => module.default);
    });
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) return setProducts([]);
      const data = await res.json();
      setProducts(data);
    } catch {
      setProducts([]);
    }
  };

  const fetchExpense = async () => {
    try {
      const res = await fetch('/api/expenses');
      if (!res.ok) {
        toast.error('فشل في جلب الصادرات');
        return setExpense([]);
      }
      const data = await res.json();
      setExpense(data);
    } catch {
      toast.error('حدث خطأ أثناء جلب الصادرات');
      setExpense([]);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchExpense();
  }, []);

  const filteredExpense = expense.filter((expense) => {
    const expenseDate = new Date(expense.date);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    const isWithinDate = (!from || expenseDate >= from) && (!to || expenseDate <= to);
    const isProductMatch = selectedProduct === 'all' || expense.product._id === selectedProduct;

    return isWithinDate && isProductMatch;
  });

  const totalExpenseAmount = filteredExpense.reduce((sum, expense) => sum + expense.totalPrice, 0);

  const addToExpense = async (productId) => {
    if (!productId) {
      toast.error('معرف الصنف غير صالح');
      return;
    }
    const quantity = parseInt(prompt('أدخل الكمية:'), 10);
    if (!quantity || quantity <= 0) {
      toast.error('يرجى إدخال كمية صالحة');
      return;
    }

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        toast.error('فشل في إضافة عملية الشراء');
        return;
      }

      toast.success('تمت إضافة عملية الشراء بنجاح');
      await fetchExpense();
    } catch {
      toast.error('حدث خطأ أثناء إضافة الشراء');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setExpense((prev) => prev.filter((expense) => expense._id !== id));
        toast.success('تم الحذف بنجاح');
      } else {
        toast.error('فشل في الحذف');
      }
    } catch {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const handlePrint = () => {
    if (!printJS) {
      toast.error('مكتبة الطباعة غير جاهزة بعد');
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
      <h1 className="text-3xl font-bold mb-6 border-b pb-3">إدارة الصادرات</h1>
{/* قائمة المنتجات */}
<div className="mb-8">
  <h2 className="text-xl font-semibold mb-4">اختر المنتج</h2>
  
  <div className="flex gap-4 items-center">
    <select
      className="p-3 border rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-green-500"
      onChange={(e) => addToExpense(e.target.value)}
    >
      <option value="">-- اختر المنتج --</option>
      {products.map((product) => (
        <option key={product._id} value={product._id}>
          {product.name} — €{product.price.toFixed(2)}
        </option>
      ))}
    </select>
  </div>
</div>


      {/* الفلاتر */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium">من</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">إلى</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">الصنف</label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-400"
          >
            <option value="all">الكل</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <FiPrinter /> طباعة
        </button>
      </div>

      {/* جدول الصادرات */}
      <div id="printable-content">
        <div className="mb-4">
          <h3 className="text-lg font-bold">تقرير الصادرات</h3>
          {fromDate && <p>من: {new Date(fromDate).toLocaleDateString('ar-EG')}</p>}
          {toDate && <p>إلى: {new Date(toDate).toLocaleDateString('ar-EG')}</p>}
          {selectedProduct !== 'all' && (
            <p>الصنف: {products.find((p) => p._id === selectedProduct)?.name || 'غير معروف'}</p>
          )}
        </div>

        <h2 className="text-lg font-bold mb-3">
          إجمالي الصادرات: €{totalExpenseAmount.toFixed(2)}
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border-b text-left">الصنف</th>
                <th className="px-4 py-2 border-b text-left">الكمية</th>
                <th className="px-4 py-2 border-b text-left">الإجمالي (€)</th>
                <th className="px-4 py-2 border-b text-left">التاريخ</th>
                <th className="px-4 py-2 border-b text-left no-print">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpense.map((exp) => (
                <tr key={exp._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b">{exp.product.name}</td>
                  <td className="px-4 py-2 border-b">{exp.quantity}</td>
                  <td className="px-4 py-2 border-b">€{exp.totalPrice.toFixed(2)}</td>
                  <td className="px-4 py-2 border-b">
                    {new Date(exp.date).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-4 py-2 border-b no-print text-center">
                    <button
                      onClick={() => handleDelete(exp._id)}
                      className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition"
                    >
                      <FiTrash2 /> حذف
                    </button>
                  </td>
                </tr>
              ))}
              {filteredExpense.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-500">
                    لا توجد بيانات
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
