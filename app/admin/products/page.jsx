'use client';

import { useEffect, useState } from 'react';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    name: '',
    price: '',
    category: '',
    images: [],
    files: [],
    previewImages: [],
  });

  const [editingId, setEditingId] = useState(null);

  // ✅ جلب الأصناف والفئات
  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
  };

  const fetchCategories = async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // ✅ رفع الصور
  const uploadFiles = async () => {
    const formData = new FormData();
    (form.files || []).forEach((file) => formData.append('files', file));
  
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
  
    if (!res.ok) {
      console.error('Upload failed');
      return [];
    }
  
    const data = await res.json();
  
    if (!data.urls || !Array.isArray(data.urls)) {
      console.error('Upload response is invalid:', data);
      return [];
    }
  
    return data.urls; // ✅ الحل هنا
  };
  

  // ✅ إرسال النموذج
  const handleSubmit = async () => {
    let uploadedUrls = form.images;

    if (form.files && form.files.length > 0) {
      uploadedUrls = await uploadFiles();
    }

    const method = editingId ? 'PUT' : 'POST';
    const url = '/api/products';

    const body = {
      name: form.name,
      price: parseFloat(form.price),
      category: form.category,
      images: uploadedUrls,
      ...(editingId && { _id: editingId }),
    };

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setForm({
      name: '',
      price: '',
      category: '',
      images: [],
      files: [],
      previewImages: [],
    });

    setEditingId(null);
    fetchProducts();
  };

  // ✅ حذف صنف
  const deleteProduct = async (id) => {
    await fetch(`/api/products?id=${id}`, {
      method: 'DELETE',
    });
    fetchProducts();
  };

  // ✅ اختيار صنف للتعديل
  const editProduct = (p) => {
    setForm({
      name: p.name,
      price: p.price,
      category: p.category?._id || '',
      images: p.images || [],
      files: [],
      previewImages: [],
    });
    setEditingId(p._id);
  };

  // ✅ معاينة الصور
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => URL.createObjectURL(file));

    setForm(prev => ({
      ...prev,
      previewImages: [...(prev.previewImages || []), ...previews],
      files: [...(prev.files || []), ...files],
    }));
  };

  // ✅ حذف صورة قبل الحفظ
  const removeImage = (index) => {
    setForm(prev => ({
      ...prev,
      previewImages: prev.previewImages.filter((_, i) => i !== index),
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{editingId ? 'تعديل الصنف' : 'صنف جديد'}</h1>

      <div className="grid gap-4">
        <input
          type="text"
          placeholder="اسم الصنف"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 rounded"
        />

        <input
          type="number"
          placeholder="السعر"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="border p-2 rounded"
        />

        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">اختر الفئة</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>

        <input type="file" multiple onChange={handleFileChange} />

        {/* ✅ عرض الصور المؤقتة */}
        <div className="flex gap-2">
          {form.previewImages.map((img, idx) => (
            <div key={idx} className="relative">
              <img src={img} className="w-24 h-24 object-cover rounded" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 hover:cursor-pointer"
        >
          {editingId ? 'تحديث' : 'إضافة'}
        </button>
      </div>

      {/* ✅ قائمة الأصناف */}
      <table className="w-full border mt-10">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">الاسم</th>
            <th className="p-2 border">السعر</th>
            <th className="p-2 border">الصنف</th>
            <th className="p-2 border">صورة</th>
            <th className="p-2 border">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id} className="text-center">
              <td className="border p-2">{p.name}</td>
              <td className="border p-2">{p.price}</td>
              <td className="border p-2">{p.category?.name || 'بدون'}</td>
              <td className="border p-2">
                {p.images?.[0] && (
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="w-16 h-16 object-cover mx-auto rounded"
                  />
                )}
              </td>
              <td className="border p-2 space-x-2">
                <button
                  onClick={() => editProduct(p)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 hover:cursor-pointer"
                >
                  تعديل
                </button>
                <button
                  onClick={() => deleteProduct(p._id)}
                  className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 hover:cursor-pointer"
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
