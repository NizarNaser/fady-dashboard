'use client';

import { useEffect, useState } from 'react';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: '',
    price: '',
    images: [],
    files: [],
    previewImages: [],
  });
  const [editingId, setEditingId] = useState(null);

  // جلب البيانات
  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    setProducts(await res.json());
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // رفع الملفات
  const uploadFiles = async () => {
    const formData = new FormData();
    (form.files || []).forEach((file) => formData.append('files', file));

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) return [];

    const data = await res.json();
    return Array.isArray(data.urls) ? data.urls : [];
  };

  // إرسال البيانات (بدون كاتيغوري)
  const handleSubmit = async () => {
    let uploadedUrls = form.images;
    if (form.files.length > 0) uploadedUrls = await uploadFiles();

    await fetch('/api/products', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        price: parseFloat(form.price),
        images: uploadedUrls,
        ...(editingId && { _id: editingId }),
      }),
    });

    setForm({ name: '', price: '', images: [], files: [], previewImages: [] });
    setEditingId(null);
    fetchProducts();
  };

  // تعديل (بدون كاتيغوري)
  const editProduct = (p) => {
    setForm({
      name: p.name,
      price: p.price,
      images: p.images || [],
      files: [],
      previewImages: [],
    });
    setEditingId(p._id);
  };

  // حذف
  const deleteProduct = async (id) => {
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    fetchProducts();
  };

  // اختيار ملفات
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setForm((prev) => ({
      ...prev,
      previewImages: [...prev.previewImages, ...previews],
      files: [...prev.files, ...files],
    }));
  };

  // حذف صورة قبل الحفظ
  const removeImage = (index) => {
    setForm((prev) => ({
      ...prev,
      previewImages: prev.previewImages.filter((_, i) => i !== index),
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white p-6 rounded-xl shadow-md mb-8">
        <h1 className="text-2xl font-bold mb-6">
          {editingId ? 'Element bearbeiten' : 'Neues Element hinzufügen'}
        </h1>

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Artikelname"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="number"
            placeholder="der Preis"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* تمت إزالة إدخال الكاتيغوري من الصفحة */}

          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="border p-3 rounded-lg"
          />
        </div>

        {/* الصور */}
        {form.previewImages.length > 0 && (
          <div className="flex gap-3 flex-wrap mt-4">
            {form.previewImages.map((img, idx) => (
              <div key={idx} className="relative w-24 h-24">
                <img src={img} className="w-full h-full object-cover rounded-lg border" />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {editingId ? 'aktualisieren' : 'Zusatz'}
        </button>
      </div>

      {/* جدول */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4">Liste der Artikel</h2>
        <table className="w-full border-collapse overflow-hidden rounded-lg">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="p-3 border">der Name</th>
              <th className="p-3 border">der Preis</th>
              <th className="p-3 border">Bild</th>
              <th className="p-3 border">Verfahren</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="text-center border-t hover:bg-gray-50">
                <td className="p-3 border">{p.name}</td>
                <td className="p-3 border">{p.price}</td>
                <td className="p-3 border">
                  {p.images?.[0] && (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="w-16 h-16 object-cover mx-auto rounded-lg border"
                    />
                  )}
                </td>
                <td className="p-3 border space-x-2">
                  <button
                    onClick={() => editProduct(p)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600"
                  >
                    Änderung
                  </button>
                  <button
                    onClick={() => deleteProduct(p._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
                  >
                    löschen
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
