'use client';
import { useEffect, useState } from 'react';
import { FiTrash2, FiPlus } from "react-icons/fi";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState('');

  // جلب الأقسام
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

  // حذف قسم
  const deleteCategory = async (id) => {
    await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
    fetchCategories();
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-3xl font-bold mb-6 border-b pb-3">إدارة الأقسام</h2>

      {/* إضافة قسم */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="اسم القسم"
          className="p-3 border rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <button
          onClick={addCategory}
          className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-3 rounded-lg transition"
        >
          <FiPlus size={18} /> إضافة
        </button>
      </div>

      {/* قائمة الأقسام */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left border-b">اسم القسم</th>
              <th className="p-3 text-center border-b">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {categories.length > 0 ? (
              categories.map((cat) => (
                <tr key={cat._id} className="hover:bg-gray-50">
                  <td className="p-3 border-b">{cat.name}</td>
                  <td className="p-3 text-center border-b">
                    <button
                      onClick={() => deleteCategory(cat._id)}
                      className="text-red-600 hover:text-red-800 transition"
                    >
                      <FiTrash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="p-4 text-center text-gray-500">
                  لا توجد أقسام مضافة بعد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
