'use client';
import { useEffect, useState } from 'react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState('');

  // جلب الأقسام من السيرفر
  const fetchCategories = async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // إضافة قسم جديد
  const addCategory = async () => {
    if (!newName.trim()) return;
    await fetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name: newName }),
      headers: { 'Content-Type': 'application/json' },
    });
    setNewName('');
    fetchCategories();
  };

  // حذف القسم
  const deleteCategory = async (id) => {
    await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
    fetchCategories();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">إدارة الأقسام</h2>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="اسم القسم"
          className="p-2 border rounded w-full"
        />
        <button onClick={addCategory} className="bg-green-600 text-white px-4 py-2 rounded">
          إضافة
        </button>
      </div>

      <ul className="space-y-2">
        {categories.map((cat) => (
          <li key={cat._id} className="flex justify-between items-center p-2 border rounded">
            <span>{cat.name}</span>
            <button onClick={() => deleteCategory(cat._id)} className="text-red-600">🗑️ حذف</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
