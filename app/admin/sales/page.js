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

  const uploadFiles = async () => {
    const formData = new FormData();
    (form.files || []).forEach((file) => formData.append('files', file));
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) return [];
    const data = await res.json();
    return data.urls || [];
  };

  const handleSubmit = async () => {
    let uploadedUrls = form.images;
    if (form.files.length > 0) uploadedUrls = await uploadFiles();
    const method = editingId ? 'PUT' : 'POST';
    const body = {
      name: form.name,
      price: parseFloat(form.price),
      category: form.category,
      images: uploadedUrls,
      ...(editingId && { _id: editingId }),
    };
    await fetch('/api/products', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setForm({ name: '', price: '', category: '', images: [], files: [], previewImages: [] });
    setEditingId(null);
    fetchProducts();
  };

  const deleteProduct = async (id) => {
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    fetchProducts();
  };

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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setForm((prev) => ({
      ...prev,
      previewImages: [...prev.previewImages, ...previews],
      files: [...prev.files, ...files],
    }));
  };

  const removeImage = (index) => {
    setForm((prev) => ({
      ...prev,
      previewImages: prev.previewImages.filter((_, i) => i !== index),
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="bg-white shadow rounded-xl p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 border-b pb-3">
        {editingId ? '✏️  Produkt bearbeiten' : '➕ Neues Produkt hinzufügen  '}
      </h1>

      <div className="grid gap-4">
        <input
          type="text"
          placeholder="Produktname "
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="number"
          placeholder="Preis"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Kategorie wählen </option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>

        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="border border-gray-300 p-2 rounded"
        />

        <div className="flex gap-2 flex-wrap">
          {form.previewImages.map((img, idx) => (
            <div key={idx} className="relative group">
              <img src={img} className="w-24 h-24 object-cover rounded-lg shadow" />
              <button
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          {editingId ? '💾 Aktualisieren' : '➕ Hinzufügen'}
        </button>
      </div>

      <table className="w-full mt-10 border-collapse shadow-sm">
        <thead>
          <tr className="bg-gray-100 text-gray-700">
            <th className="p-3 border">Name</th>
            <th className="p-3 border">Preis</th>
            <th className="p-3 border">Kategorie</th>
            <th className="p-3 border">Bild</th>
            <th className="p-3 border">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id} className="text-center hover:bg-gray-50">
              <td className="border p-3">{p.name}</td>
              <td className="border p-3">{p.price}</td>
              <td className="border p-3">{p.category?.name || 'Keine'}</td>
              <td className="border p-3">
                {p.images?.[0] && (
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="w-16 h-16 object-cover mx-auto rounded-lg shadow"
                  />
                )}
              </td>
              <td className="border p-3 space-x-2">
                <button
                  onClick={() => editProduct(p)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
                >
                  Bearbeiten ✏️ </button>
                <button
                  onClick={() => deleteProduct(p._id)}
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
  );
}
