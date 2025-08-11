// app/dashboard/layout.jsx
import Link from 'next/link';
import '@/styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { Providers } from '@/providers';
export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      {/* الشريط الجانبي */}
      <aside className="w-64 bg-gray-900 text-white p-4 space-y-4">
        <h2 className="text-2xl font-bold mb-6">لوحة التحكم</h2>
        <hr />
        <nav className="space-y-2">
          <h2 className="text-2xl font-bold mb-6">الأقسام و الأصناف </h2>
          <Link href="/admin" className="block hover:text-yellow-400">الرئيسية</Link>
          <Link href="/admin/categories" className="block hover:text-yellow-400">الأقسام</Link>
          <Link href="/admin/products" className="block hover:text-yellow-400">الأصناف</Link>
          <hr />
          <h2 className="text-2xl font-bold mb-6"> الواردات</h2>
          <Link href="/admin/sales" className="block hover:text-yellow-400">صفحة الواردات</Link>
          <hr />
          <h2 className="text-2xl font-bold mb-6"> الصادرات</h2>
          <Link href="/admin/expenses" className="block hover:text-yellow-400">صفحة الصادرات</Link>
          <hr />
          <h2 className="text-2xl font-bold mb-6"> الأرباح والمبيعات</h2>
          <Link href="/admin/profits" className="block hover:text-yellow-400">صفحة الأرباح والمبيعات</Link>

        </nav>
      </aside>

      {/* المحتوى */}
      <main className="flex-1 bg-gray-50 p-6">
        <Toaster position="top-center" reverseOrder={false} />
        <Providers>
          {children}
        </Providers>
      </main>
    </div>
  );
}
