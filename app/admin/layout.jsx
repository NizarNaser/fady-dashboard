"use client";

import Link from "next/link";
import { useState } from "react";
import "@/styles/globals.css";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/providers";
import { FiMenu, FiX, FiHome, FiBox, FiTag, FiBarChart2, FiDownload, FiUpload } from "react-icons/fi";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    {
      section: "الأقسام و الأصناف",
      links: [
        { href: "/admin", label: "الرئيسية", icon: <FiHome /> },
        { href: "/admin/categories", label: "الأقسام", icon: <FiTag /> },
        { href: "/admin/products", label: "الأصناف", icon: <FiBox /> },
      ],
    },
    {
      section: "الواردات",
      links: [{ href: "/admin/sales", label: "صفحة الواردات", icon: <FiDownload /> }],
    },
    {
      section: "الصادرات",
      links: [{ href: "/admin/expenses", label: "صفحة الصادرات", icon: <FiUpload /> }],
    },
    {
      section: "الأرباح والمبيعات",
      links: [{ href: "/admin/stats", label: "صفحة الأرباح والمبيعات", icon: <FiBarChart2 /> }],
    },
  ];

  return (
    <div className="flex">
      {/* زر فتح السايدبار للموبايل */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg shadow-lg"
        aria-label="فتح القائمة الجانبية"
      >
        <FiMenu size={22} />
      </button>

      {/* الخلفية الشفافة عند فتح السايدبار */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* الشريط الجانبي */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-gray-900 text-white p-5 space-y-6 z-50 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:h-screen md:flex-shrink-0 shadow-lg`}
      >
        {/* زر إغلاق للموبايل */}
        <div className="flex justify-between items-center md:hidden">
          <h2 className="text-xl font-bold">لوحة التحكم</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="إغلاق القائمة الجانبية"
            className="text-white hover:text-yellow-400"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* العنوان */}
        <h2 className="hidden md:block text-2xl font-bold mb-4 border-b border-gray-700 pb-2">
          لوحة التحكم
        </h2>

        {/* القائمة */}
        <nav className="space-y-6">
          {menuItems.map((section, i) => (
            <div key={i}>
              <h3 className="text-lg font-semibold mb-3 text-yellow-400">{section.section}</h3>
              <ul className="space-y-2">
                {section.links.map((link, idx) => (
                  <li key={idx}>
                    <Link
                      href={link.href}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <span className="text-yellow-400">{link.icon}</span>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 bg-gray-100 min-h-screen p-6">
        <Toaster position="top-center" reverseOrder={false} />
        <Providers>{children}</Providers>
      </main>
    </div>
  );
}
