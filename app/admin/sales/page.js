'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function SalesPage() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [printJS, setPrintJS] = useState(null);

  // استيراد مكتبة print-js بشكل ديناميكي على العميل فقط
  useEffect(() => {
    import('print-js').then((module) => {
      setPrintJS(() => module.default);
    });
  }, []);

  // جلب المنتجات
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) {
        const text = await res.text();
        console.error('⚠️ استجابة غير ناجحة:', res.status, text);
        setProducts([]);
        return;
      }
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('❌ خطأ في fetchProducts:', error.message);
      setProducts([]);
    }
  };

  // جلب الواردات
  const fetchSales = async () => {
    try {
      const res = await fetch('/api/sales');
      if (!res.ok) {
        toast.error('فشل في جلب الواردات');
        setSales([]);
        return;
      }
      const data = await res.json();
      setSales(data);
    } catch (error) {
      toast.error('حدث خطأ أثناء جلب الواردات');
      setSales([]);
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSales();
  }, []);

  // تصفية الواردات حسب التاريخ والصنف
  const filteredSales = sales.filter((sale) => {
    const saleDate = new Date(sale.date);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    const isWithinDate = (!from || saleDate >= from) && (!to || saleDate <= to);
    const isProductMatch = selectedProduct === 'all' || sale.product._id === selectedProduct;

    return isWithinDate && isProductMatch;
  });

  // حساب إجمالي الواردات
  const totalSalesAmount = filteredSales.reduce((sum, sale) => sum + sale.totalPrice, 0);

  // إضافة وارد جديد
  const addToSales = async (productId) => {
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
      const res = await fetch('/api/sales', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        toast.error('فشل في إضافة عملية الوارد');
        return;
      }

      toast.success('تمت إضافة عملية الوارد بنجاح');
      await fetchSales(); // تحديث قائمة المبيعات بعد الإضافة
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء إضافة الوارد');
    }
  };

  // حذف عملية الوارد
  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه العملية؟')) return;

    try {
      const res = await fetch(`/api/sales?id=${id}`, { method: 'DELETE' });

      if (res.ok) {
        setSales((prev) => prev.filter((sale) => sale._id !== id));
        toast.success('تم حذف عملية الوارد بنجاح');
      } else {
        toast.error('فشل في حذف عملية الوارد');
      }
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  // دالة الطباعة مع إخفاء زر الحذف عند الطباعة
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">صفحة الواردات</h1>

      <h2 className="text-xl font-semibold mb-2">الأصناف</h2>
      <ul className="flex flex-wrap gap-1 mb-2">
        {products.map((product) => (
          <li
            key={product._id}
            className="p-1 border rounded shadow flex justify-between items-center w-md"
          >
            <div className="flex gap-1">
              <span className="font-bold">{product.name}</span>
              <span className="text-sm text-gray-600">السعر: €{product.price.toFixed(2)}</span>
            </div>
            <button
              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 hover:cursor-pointer"
              onClick={() => addToSales(product._id)}
            >
              إضافة إلى الواردات
            </button>
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mb-4">سجل الواردات</h2>
      <div className="bg-gray-100 p-4 rounded mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium">من</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">إلى</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">الصنف</label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="all">الكل</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 hover:cursor-pointer"
        >
          طباعة النتائج
        </button>
      </div>

      {/* محتوى الطباعة */}
      <div id="printable-content" className="bg-white p-4 rounded shadow">
        <div className="mb-4">
          <h3 className="text-lg font-bold">تقرير الواردات</h3>
          {fromDate && <p>من: {new Date(fromDate).toLocaleDateString('ar-EG')}</p>}
          {toDate && <p>إلى: {new Date(toDate).toLocaleDateString('ar-EG')}</p>}
          {selectedProduct !== 'all' && (
            <p>
              الصنف: {products.find((p) => p._id === selectedProduct)?.name || 'غير معروف'}
            </p>
          )}
        </div>

        <h2 className="text-lg font-bold mb-2">
          إجمالي الواردات: €{totalSalesAmount.toFixed(2)}
        </h2>

        <table className="min-w-full bg-white border border-gray-200">
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
            {filteredSales.map((sale) => (
              <tr key={sale._id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-b">{sale.product.name}</td>
                <td className="px-4 py-2 border-b">{sale.quantity}</td>
                <td className="px-4 py-2 border-b">€{sale.totalPrice.toFixed(2)}</td>
                <td className="px-4 py-2 border-b">
                  {new Date(sale.date).toLocaleDateString('ar-EG')}
                </td>
                <td className="px-4 py-2 border-b no-print">
                  <button
                    onClick={() => handleDelete(sale._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 hover:cursor-pointer"
                  >
                    حذف
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
