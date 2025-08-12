"use client";

import Link from "next/link";
import { useState } from "react";
import "@/styles/globals.css";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/providers";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* زر فتح السايدبار (يظهر فقط في الشاشات الصغيرة) */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden bg-gray-900 text-white p-2 rounded"
        aria-label="فتح القائمة الجانبية"
      >
        ☰
      </button>

      {/* الخلفية الشفافة عند فتح السايدبار على الشاشات الصغيرة */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        />
      )}

      {/* الشريط الجانبي */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-gray-900 text-white p-4 space-y-4 z-50 transform transition-transform duration-300 ease-in-out
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
    md:translate-x-0 md:static md:h-screen md:flex-shrink-0`}
      >
        {/* زر إغلاق */}
        <div className="flex justify-end mb-4 md:hidden">
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="إغلاق القائمة الجانبية"
            className="text-white text-2xl font-bold focus:outline-none"
          >
            &times;
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-6">لوحة التحكم</h2>
        <hr />
        <nav className="space-y-2">
          <h2 className="text-2xl font-bold mb-6">الأقسام و الأصناف </h2>
          <Link href="/admin" className="block hover:text-yellow-400">
            الرئيسية
          </Link>
          <Link href="/admin/categories" className="block hover:text-yellow-400">
            الأقسام
          </Link>
          <Link href="/admin/products" className="block hover:text-yellow-400">
            الأصناف
          </Link>
          <hr />
          <h2 className="text-2xl font-bold mb-6"> الواردات</h2>
          <Link href="/admin/sales" className="block hover:text-yellow-400">
            صفحة الواردات
          </Link>
          <hr />
          <h2 className="text-2xl font-bold mb-6"> الصادرات</h2>
          <Link href="/admin/expenses" className="block hover:text-yellow-400">
            صفحة الصادرات
          </Link>
          <hr />
          <h2 className="text-2xl font-bold mb-6"> الأرباح والمبيعات</h2>
          <Link href="/admin/stats" className="block hover:text-yellow-400">
            صفحة الأرباح والمبيعات
          </Link>
        </nav>
      </aside>

      {/* المحتوى */}
      <main className="flex-1 bg-gray-50 p-6 md:ml-64">
        <Toaster position="top-center" reverseOrder={false} />
        <Providers>{children}</Providers>
      </main>
    </>
  );
}
