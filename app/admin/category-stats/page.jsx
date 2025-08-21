"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

export default function CategoryStatsPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // dynamic libs
  const [XLSX, setXLSX] = useState(null);
  const [printJS, setPrintJS] = useState(null);

  // فلتر الفئة
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    import("xlsx")
      .then((m) => setXLSX(m))
      .catch(() => {
        console.warn("xlsx not available (install it with `npm i xlsx` to enable Excel export).");
      });

    import("print-js")
      .then((m) => setPrintJS(() => m.default))
      .catch(() => {
        console.warn("print-js not available (install it with `npm i print-js` to enable printing).");
      });
  }, []);

  // جلب البيانات الأساسية
  const fetchAll = async () => {
    try {
      setLoading(true);

      const [catRes, prodRes, salesRes, expRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/products"),
        fetch("/api/sales"),
        fetch("/api/expenses"),
      ]);

      const [catData, prodData, salesData, expensesData] = await Promise.all([
        catRes.ok ? catRes.json() : [],
        prodRes.ok ? prodRes.json() : [],
        salesRes.ok ? salesRes.json() : [],
        expRes.ok ? expRes.json() : [],
      ]);

      setCategories(Array.isArray(catData) ? catData : []);
      setProducts(Array.isArray(prodData) ? prodData : []);
      setSales(Array.isArray(salesData) ? salesData : []);
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
    } catch (e) {
      console.error("Fetch error:", e);
      toast.error("Fehler beim Abrufen der Daten");
      setCategories([]);
      setProducts([]);
      setSales([]);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // خريطة منتج -> فئة واسم الفئة
  const productToCategory = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      const catId = typeof p.category === "object" ? p.category?._id : p.category;
      const catName =
        typeof p.category === "object"
          ? p.category?.name
          : categories.find((c) => c._id === catId)?.name || "Ohne";
      map.set(p._id, { catId: catId || "uncategorized", catName: catName || "Ohne", productName: p.name });
    }
    return map;
  }, [products, categories]);

  // تجميع حسب الفئة (بدون تاريخ)
  const allCategoryRows = useMemo(() => {
    const agg = new Map();

    // prefill categories so they show even if صفر
    for (const c of categories) {
      agg.set(c._id, { categoryId: c._id, categoryName: c.name, sales: 0, expenses: 0 });
    }

    // sum sales
    for (const s of sales) {
      const prodId = typeof s.product === "object" ? s.product?._id : s.product;
      const link = productToCategory.get(prodId);
      const key = link?.catId || "uncategorized";
      const name = link?.catName || categories.find((c) => c._id === key)?.name || "بدون";
      const cur = agg.get(key) || { categoryId: key, categoryName: name, sales: 0, expenses: 0 };
      agg.set(key, { ...cur, categoryName: name, sales: (cur.sales || 0) + (Number(s.totalPrice) || 0) });
    }

    // sum expenses
    for (const ex of expenses) {
      const prodId = typeof ex.product === "object" ? ex.product?._id : ex.product;
      const link = productToCategory.get(prodId);
      const key = link?.catId || "uncategorized";
      const name = link?.catName || categories.find((c) => c._id === key)?.name || "بدون";
      const cur = agg.get(key) || { categoryId: key, categoryName: name, sales: 0, expenses: 0 };
      agg.set(key, { ...cur, categoryName: name, expenses: (cur.expenses || 0) + (Number(ex.totalPrice) || 0) });
    }

    const list = Array.from(agg.values()).map((r) => ({ ...r, profit: (r.sales || 0) - (r.expenses || 0) }));
    list.sort((a, b) => b.profit - a.profit);
    return list;
  }, [sales, expenses, productToCategory, categories]);

  // تفصيل داخل الفئة: عند اختيار فئة واحدة، نجمع على مستوى المنتجات داخل الفئة
  const detailRowsByProduct = useMemo(() => {
    if (selectedCategory === "all") return [];
    // products in category:
    const prods = products.filter((p) => {
      const catId = typeof p.category === "object" ? p.category?._id : p.category;
      return catId === selectedCategory;
    });

    const map = new Map();

    // init
    for (const p of prods) {
      map.set(p._id, { productId: p._id, productName: p.name, sales: 0, expenses: 0, profit: 0 });
    }

    // aggregate sales
    for (const s of sales) {
      const prodId = typeof s.product === "object" ? s.product?._id : s.product;
      if (!map.has(prodId)) continue;
      const cur = map.get(prodId);
      cur.sales = (cur.sales || 0) + (Number(s.totalPrice) || 0);
      map.set(prodId, cur);
    }

    // aggregate expenses
    for (const ex of expenses) {
      const prodId = typeof ex.product === "object" ? ex.product?._id : ex.product;
      if (!map.has(prodId)) continue;
      const cur = map.get(prodId);
      cur.expenses = (cur.expenses || 0) + (Number(ex.totalPrice) || 0);
      map.set(prodId, cur);
    }

    const list = Array.from(map.values()).map((r) => ({ ...r, profit: (r.sales || 0) - (r.expenses || 0) }));
    list.sort((a, b) => b.profit - a.profit);
    return list;
  }, [selectedCategory, products, sales, expenses]);

  // displayedRows يعتمد على اختيار الفئة
  const displayedRows = selectedCategory === "all" ? allCategoryRows : detailRowsByProduct;

  // totals — حسب العرض الحالي
  const totals = useMemo(() => {
    const totalSales = displayedRows.reduce((sum, r) => sum + (r.sales || 0), 0);
    const totalExpenses = displayedRows.reduce((sum, r) => sum + (r.expenses || 0), 0);
    const totalProfit = totalSales - totalExpenses;
    return { totalSales, totalExpenses, totalProfit };
  }, [displayedRows]);

  // === تصدير إلى Excel ===
  const exportToExcel = () => {
    if (!XLSX) {
      toast.error("Exportbibliothek nicht installiert. Installieren Sie: npm i xlsx");
      return;
    }
    if (!displayedRows || displayedRows.length === 0) {
      toast.error("Keine Daten zum Exportieren");
      return;
    }
    try {
      let sheetData;
      if (selectedCategory === "all") {
        sheetData = displayedRows.map((r) => ({
          "Kategorie": r.categoryName,
          " Umsatz (€)": Number((r.sales || 0).toFixed(2)),
          " Ausgaben (€)": Number((r.expenses || 0).toFixed(2)),
          " Gewinn (€)": Number((r.profit || 0).toFixed(2)),
        }));
      } else {
        sheetData = displayedRows.map((r) => ({
          "Kategorie": r.productName,
          " Umsatz (€)": Number((r.sales || 0).toFixed(2)),
          " Ausgaben (€)": Number((r.expenses || 0).toFixed(2)),
          " Gewinn (€)": Number((r.profit || 0).toFixed(2)),
        }));
      }
      const ws = XLSX.utils.json_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "CategoryStats");
      XLSX.writeFile(wb, `category-stats-${selectedCategory === "all" ? "all" : selectedCategory}-${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (err) {
      console.error(err);
      toast.error("Export nach Excel fehlgeschlagen");
    }
  };

  // === طباعة/PDF باستخدام print-js إن وُجد ===
  const handlePrint = () => {
    if (!printJS) {
      toast.error("Druckbibliothek nicht verfügbar. Führe aus: npm i print-js");
      return;
    }
    if (!displayedRows || displayedRows.length === 0) {
      toast.error("Keine Daten zum Drucken");
      return;
    }

    printJS({
      printable: "printable-content",
      type: "html",
      documentTitle: selectedCategory === "all" ? "Kategorienbericht" : `Bericht der Kategorie  ${categories.find(c => c._id === selectedCategory)?.name || selectedCategory}`,
      style: `
        @media print {
          .no-print { display: none !important; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #222 !important; padding: 8px; font-size: 12px; }
        }
      `,
    });
  };

  return (
    <div className="bg-white shadow rounded-xl p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 border-b pb-3">📈 Gewinne und Ausgaben nach Kategorie</h1>

      {/* فلاتر + بطاقات إجمالية */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600"> Nach Kategorie filtern:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border px-3 py-2 rounded-lg"
          >
            <option value="all">Alle</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full md:w-auto">
          <div className="rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-gray-500 text-sm">Gesamtumsatz </div>
            <div className="text-2xl font-extrabold mt-1">€{totals.totalSales.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-gray-500 text-sm">Gesamtausgaben </div>
            <div className="text-2xl font-extrabold mt-1">€{totals.totalExpenses.toFixed(2)}</div>
          </div>
          <div className={`rounded-xl border p-4 shadow-sm ${totals.totalProfit >= 0 ? "border-green-200" : "border-red-200"}`}>
            <div className="text-gray-500 text-sm">Reingewinn </div>
            <div className={`text-2xl font-extrabold mt-1 ${totals.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              €{totals.totalProfit.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* أزرار التصدير والطباعة */}
      <div className="flex gap-3 items-center no-print">
        <button onClick={fetchAll} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">🔄 Aktualisieren</button>
        <button onClick={exportToExcel} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">📥 Excel exportieren </button>
        <button onClick={handlePrint} className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">🖨 Drucken / PDF</button>
      </div>

      {/* محتوى قابل للطباعة */}
      <div id="printable-content">
        <h2 className="text-lg font-bold mb-2">
          {selectedCategory === "all" ? "Kategorienbericht (ohne Datum)" : ` Kategorie-Details: ${categories.find(c => c._id === selectedCategory)?.name || selectedCategory}`}
        </h2>

        <table className="w-full border-collapse shadow-sm mt-4">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="p-3 border text-right">{selectedCategory === "all" ? "Kategorie" : "Produkt"}</th>
              <th className="p-3 border text-right">Umsatz (€)</th>
              <th className="p-3 border text-right">Ausgaben (€)</th>
              <th className="p-3 border text-right">Gewinn (€)</th>
            </tr>
          </thead>
          <tbody>
            {displayedRows.map((r) => (
              <tr key={selectedCategory === "all" ? r.categoryId : r.productId} className="hover:bg-gray-50">
                <td className="p-3 border">{selectedCategory === "all" ? r.categoryName : r.productName}</td>
                <td className="p-3 border">€{(r.sales || 0).toFixed(2)}</td>
                <td className="p-3 border">€{(r.expenses || 0).toFixed(2)}</td>
                <td className={`p-3 border font-semibold ${r.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  €{(r.profit || 0).toFixed(2)}
                </td>
              </tr>
            ))}
            {displayedRows.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">Keine Daten  </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
