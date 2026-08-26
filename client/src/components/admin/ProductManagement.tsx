
import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ImageOff } from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete, listStorage, uploadStorage, deleteStorage } from "@/lib/api";
import { convertImageUrl } from "@/lib/imageUtils";
import { Dialog } from "@headlessui/react";
import { ProductDetails } from "./ProductDetails";
import toast from "react-hot-toast";

const PAGE_SIZE = 20;

interface Category {
  id: number;
  name: string;
  image?: string;
}

interface Product {
  id: number;
  name: string;
  code: string;
  category_id: number;
  description: string;
  image_path: string;
  original_price?: number;
  discounted_price?: number;
  discount_percentage?: number;
  is_active: boolean;
  brand?: string;
  promo?: boolean;
  new?: boolean;
  popular?: boolean;
  stock_status?: string;
  form?: string | null;  // repurposed to store stock quantity
  tva?: string | number | null;
  categoryName?: string;
  imageUrl?: string;
}

const normalizeStockStatus = (value: unknown): string =>
  String(value ?? "en stock").trim().toLowerCase();

const getStock = (product: Product | null | undefined): number | null => {
  if (product?.form === null || product?.form === undefined || product?.form === "") return null;
  const n = Number(product.form);
  return isNaN(n) ? null : n;
};

const isOutOfStock = (product: Product | null | undefined): boolean =>
  normalizeStockStatus(product?.stock_status) === "en rupture de stock" ||
  (getStock(product) !== null && (getStock(product) as number) <= 0);

const PLACEHOLDER_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f3f4f6'/></svg>";

const hasImage = (product: Product) =>
  !!(product.imageUrl && product.imageUrl.trim() !== "" && product.imageUrl !== "/placeholder.webp" && product.imageUrl !== PLACEHOLDER_SVG);

export const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingStockIds, setSavingStockIds] = useState<number[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [filterNew, setFilterNew] = useState(false);
  const [filterPopular, setFilterPopular] = useState(false);
  const [filterOutOfStock, setFilterOutOfStock] = useState(false);
  const [filterInStock, setFilterInStock] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [formData, setFormData] = useState<any>({
    name: "",
    description: "",
    description_detaillee: "",
    contenance: "",
    code: "",
    originalPrice: "",
    discountedPrice: "",
    image_file: null,
    category_id: 0,
    brand: "",
    promo: false,
    new: false,
    popular: false,
    outOfStock: false,
    stock: "",  // stored in DB 'form' column
    tva: "",
  });

  // Fetch categories once
  useEffect(() => {
    apiGet("/api/categories").then((data) => {
      if (data) setCategories(data as Category[]);
    });
  }, []);

  // Build base filter query params (without range/order)
  const buildBaseQuery = useCallback(() => {
    const applyFilters = (params: URLSearchParams) => {
      if (filterNew) params.set("new", "1");
      if (filterPopular) params.set("popular", "1");
      if (filterOutOfStock) params.set("stockStatus", "en rupture de stock");
      if (filterInStock) params.set("inStockNotLow", "1");
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      return params;
    };
    return { applyFilters };
  }, [filterNew, filterPopular, filterOutOfStock, filterInStock, searchTerm]);

  // Client-side filter helpers (the products API has no filters beyond
  // activeOnly/withImageOnly, so we filter in JS after fetching the
  // active/with-image product set).
  const matchesFilters = useCallback((p: Product) => {
    if (filterNew && !p.new) return false;
    if (filterPopular && !p.popular) return false;
    if (filterOutOfStock && normalizeStockStatus(p.stock_status) !== "en rupture de stock") return false;
    if (filterInStock) {
      if (normalizeStockStatus(p.stock_status) !== "en stock") return false;
      const stock = getStock(p);
      if (stock !== null && stock <= 0) return false;
    }
    if (searchTerm.trim() && !p.name?.toLowerCase().includes(searchTerm.trim().toLowerCase())) return false;
    return true;
  }, [filterNew, filterPopular, filterOutOfStock, filterInStock, searchTerm]);

  // Fetch total count (with + without image)
  const fetchCount = useCallback(async () => {
    const [withImg, withoutImg]: [Product[], Product[]] = await Promise.all([
      apiGet("/api/products?activeOnly=1&withImageOnly=1"),
      apiGet("/api/products?activeOnly=1"),
    ]);
    const withIds = new Set(withImg.map((p) => p.id));
    const withoutOnly = withoutImg.filter((p) => !withIds.has(p.id));
    const total = withImg.filter(matchesFilters).length + withoutOnly.filter(matchesFilters).length;
    setTotalCount(total);
  }, [matchesFilters]);

  // Fetch current page: WITH IMAGE first, WITHOUT IMAGE last
  const fetchPage = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const [withImgAll, allActive]: [Product[], Product[]] = await Promise.all([
        apiGet("/api/products?activeOnly=1&withImageOnly=1&sort=id&order=desc"),
        apiGet("/api/products?activeOnly=1&sort=id&order=desc"),
      ]);

      const withIds = new Set(withImgAll.map((p) => p.id));
      const withoutImgAll = allActive.filter((p) => !withIds.has(p.id));

      const qWith = withImgAll.filter(matchesFilters);
      const qWithout = withoutImgAll.filter(matchesFilters);

      const totalWith = qWith.length;

      const pageStart = (page - 1) * PAGE_SIZE; // 0-indexed global start
      const pageEnd = pageStart + PAGE_SIZE - 1; // 0-indexed global end (inclusive)

      const catMap: Record<number, string> = {};
      categories.forEach(c => { catMap[c.id] = c.name; });

      let combined: Product[] = [];

      // --- Slice from "with image" pool ---
      if (pageStart < totalWith) {
        const from = pageStart;
        const to = Math.min(pageEnd, totalWith - 1);
        combined = qWith.slice(from, to + 1);
      }

      // --- Slice from "without image" pool if needed ---
      if (pageEnd >= totalWith) {
        const withoutStart = Math.max(0, pageStart - totalWith);
        const withoutEnd = withoutStart + (PAGE_SIZE - combined.length);
        combined = [...combined, ...qWithout.slice(withoutStart, withoutEnd)];
      }

      const productsWithExtras = await Promise.all(
        combined.map(async (product: Product) => {
          let imageUrl = '';
          if (product.image_path) {
            if (product.image_path.startsWith('http')) {
              imageUrl = product.image_path;
            } else {
              const isFolder = !product.image_path.match(/\.(jpg|jpeg|png|gif|webp)$/i);
              if (isFolder) {
                const folder = product.image_path.replace(/^image\//, '');
                const files = await listStorage(`image/${folder}`);
                if (files && files.length > 0) {
                  const sorted = files.sort((a, b) => a.name.localeCompare(b.name));
                  imageUrl = sorted[0].url;
                }
              } else {
                imageUrl = product.image_path;
              }
            }
          }

          return {
            ...product,
            imageUrl: imageUrl || "/placeholder.webp",
            categoryName: catMap[product.category_id] ?? "Uncategorized",
          };
        })
      );

      const sortedProducts = productsWithExtras.sort((a, b) => {
        const aHasImg = !!(a.imageUrl && a.imageUrl !== "/placeholder.webp");
        const bHasImg = !!(b.imageUrl && b.imageUrl !== "/placeholder.webp");
        if (aHasImg && !bHasImg) return -1;
        if (!aHasImg && bHasImg) return 1;
        return 0;
      });

      setProducts(sortedProducts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [buildBaseQuery, categories]);

  // When filters/search/page change → reload
  useEffect(() => {
    if (categories.length === 0) return;
    fetchCount();
    fetchPage(currentPage);
  }, [currentPage, fetchCount, fetchPage, categories]);

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterNew, filterPopular, filterOutOfStock, filterInStock, searchTerm]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const refreshCurrentPage = () => {
    fetchCount();
    fetchPage(currentPage);
  };

  // ✅ Add / Edit Product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let image_path = editingProduct ? editingProduct.image_path : "";

      if (formData.image_file) {
        const file = formData.image_file as File;
        const uploaded = await uploadStorage("produits", file);
        image_path = uploaded.url;
      }

      const stockValue = formData.stock !== "" ? formData.stock.toString() : null;
      const stockNum = stockValue !== null ? Number(stockValue) : null;
      const autoOutOfStock = stockNum !== null && stockNum <= 0;

      const payload: any = {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        description_detaillee: formData.description_detaillee,
        contenance: formData.contenance,
        brand: formData.brand,
        original_price: parseFloat(formData.originalPrice),
        image_path,
        category_id: Number(formData.category_id),
        new: formData.new,
        popular: formData.popular,
        stock_status: (formData.outOfStock || autoOutOfStock) ? "en rupture de stock" : "en stock",
        form: stockValue,
        tva: formData.tva !== "" ? formData.tva : null,
        is_active: true,
      };

      if (editingProduct) {
        await apiPut(`/api/products/${editingProduct.id}`, payload);
      } else {
        await apiPost("/api/products", payload);
      }

      refreshCurrentPage();
      resetForm();
      toast.success(editingProduct ? "Produit mis à jour avec succès !" : "Produit ajouté avec succès !");
    } catch (err: any) {
      console.error("Error saving product:", err);
      toast.error(`Erreur : ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Toggle flags
  const toggleProductFlag = async (id: number, flag: "new" | "popular") => {
    try {
      const product = products.find((p) => p.id === id);
      if (!product) return;
      const newValue = !product[flag];
      await apiPut(`/api/products/${id}`, { [flag]: newValue });
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, [flag]: newValue } : p)));
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  const setProductOutOfStock = async (id: number, checked: boolean) => {
    const previousProducts = products;
    const newStockStatus = checked ? "en rupture de stock" : "en stock";

    try {
      setSavingStockIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock_status: newStockStatus } : p)));

      const data = await apiPut(`/api/products/${id}`, { stock_status: newStockStatus });

      const savedStockStatus = normalizeStockStatus(data?.stock_status);
      if (savedStockStatus !== newStockStatus) {
        throw new Error(`Le serveur a renvoyé stock_status='${data?.stock_status}', attendu '${newStockStatus}'.`);
      }

      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock_status: data.stock_status } : p)));
    } catch (err: any) {
      setProducts(previousProducts);
      console.error("Stock status update error:", err);
      toast.error(`Erreur stock : ${err?.message || err}`);
    } finally {
      setSavingStockIds((prev) => prev.filter((productId) => productId !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "", description: "", code: "", originalPrice: "", discountedPrice: "",
      image_file: null, category_id: 0, promo: false, new: false, popular: false,
      outOfStock: false, description_detaillee: "", contenance: "", brand: "", stock: "", tva: "",
    });
    setEditingProduct(null);
    setShowModal(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      code: product.code || "",
      originalPrice: product.original_price?.toString() || "",
      discountedPrice: product.discounted_price?.toString() || "",
      image_file: null,
      category_id: product.category_id,
      promo: product.promo || false,
      new: product.new || false,
      popular: product.popular || false,
      outOfStock: isOutOfStock(product),
      description_detaillee: (product as any).description_detaillee || "",
      contenance: (product as any).contenance || "",
      brand: product.brand || "",
      stock: product.form ?? "",
      tva: product.tva?.toString() ?? product.discount_percentage?.toString() ?? "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    if (!window.confirm("Supprimer ce produit ?")) return;

    try {
      await apiDelete(`/api/products/${id}`);

      if (product.image_path && product.image_path.includes("/produits/")) {
        const filename = product.image_path.split("/produits/").pop();
        if (filename) {
          await deleteStorage("produits", filename);
        }
      }

      toast.success("Produit supprimé avec succès !");
      refreshCurrentPage();
    } catch (err: any) {
      console.error("Error deleting product:", err);
      toast.error(`Erreur : ${err?.message || "Erreur lors de la suppression du produit"}`);
    }
  };

  // Pagination helpers
  const goToPage = (page: number) => {
    const p = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Produits</h1>
          <p className="text-gray-500 text-sm mt-1">
            {totalCount.toLocaleString()} produit{totalCount > 1 ? "s" : ""} au total
            {" — "}Page {currentPage} / {totalPages || 1}
            {" — "}Affichage {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalCount)}–{Math.min(currentPage * PAGE_SIZE, totalCount)}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Ajouter Produit</span>
        </button>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-3 rounded-lg border">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={filterNew} onChange={(e) => setFilterNew(e.target.checked)} className="accent-blue-500 w-4 h-4" />
          <span className="text-sm font-medium text-blue-600">Nouveau</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={filterPopular} onChange={(e) => setFilterPopular(e.target.checked)} className="accent-red-500 w-4 h-4" />
          <span className="text-sm font-medium text-red-500">Populaire</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filterOutOfStock}
            onChange={(e) => {
              setFilterOutOfStock(e.target.checked);
              if (e.target.checked) setFilterInStock(false);
            }}
            className="accent-gray-600 w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-600">Out of stock</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filterInStock}
            onChange={(e) => {
              setFilterInStock(e.target.checked);
              if (e.target.checked) setFilterOutOfStock(false);
            }}
            className="accent-green-600 w-4 h-4"
          />
          <span className="text-sm font-medium text-green-600">In stock</span>
        </label>
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border px-4 py-2 rounded-lg w-full text-sm"
          />
        </div>
      </div>

      {/* Pagination TOP */}
      {totalPages > 1 && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          pageNumbers={pageNumbers()}
          goToPage={goToPage}
        />
      )}

      {/* Product Grid */}
      {products.length === 0 && loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4 animate-pulse">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-gray-200 h-64 rounded-lg" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">Aucun produit trouvé</p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4 transition-opacity duration-200 ${
          loading ? "opacity-50 pointer-events-none" : "opacity-100"
        }`}>
          {products.map((product) => (
            <div
              key={product.id}
              className={`border rounded-lg p-4 shadow-sm relative transition ${
                isOutOfStock(product) ? "bg-gray-100 opacity-60 grayscale" : "bg-white"
              }`}
            >
              {/* No image badge */}
              {!hasImage(product) && (
                <div className="absolute top-2 right-2 z-10 bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <ImageOff className="w-3 h-3" />
                  Sans image
                </div>
              )}

              <img
                src={hasImage(product) ? convertImageUrl(product.imageUrl) : PLACEHOLDER_SVG}
                alt={product.name}
                className="w-full h-48 object-cover rounded cursor-pointer bg-gray-100"
                onClick={() => setSelectedProductId(product.id)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== PLACEHOLDER_SVG) {
                    target.src = PLACEHOLDER_SVG;
                  }
                }}
              />
              <h3 className="font-semibold mt-2 text-sm line-clamp-2">{product.name}</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line line-clamp-2">
                {(product.description || "").replace(/\\n/g, "\n")}
              </p>

              <p className="font-bold mt-1">{product.original_price} DT</p>

              <p className="text-gray-500 text-sm">Catégorie: {product.categoryName}</p>
              <p className="text-gray-500 text-sm font-medium">
                Stock: {product.form != null && product.form !== "" ? product.form : "—"} | TVA: {product.tva ?? product.discount_percentage ?? "—"}%
              </p>

              {isOutOfStock(product) && (
                <span className="inline-block mt-2 rounded-full bg-gray-800 px-3 py-1 text-xs font-semibold text-white">
                  Out of stock
                </span>
              )}

              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-800">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Flags */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                <label className="flex items-center bg-white/90 px-2 py-1 rounded shadow cursor-pointer text-xs font-semibold text-blue-500">
                  <input
                    type="checkbox"
                    checked={product.new || false}
                    onChange={() => toggleProductFlag(product.id, "new")}
                    className="w-3 h-3 accent-blue-500 mr-1"
                  />
                  Nouveau
                </label>
                <label className="flex items-center bg-white/90 px-2 py-1 rounded shadow cursor-pointer text-xs font-semibold text-red-500">
                  <input
                    type="checkbox"
                    checked={product.popular || false}
                    onChange={() => toggleProductFlag(product.id, "popular")}
                    className="w-3 h-3 accent-red-500 mr-1"
                  />
                  Populaire
                </label>
                <label className="flex items-center bg-white/90 px-2 py-1 rounded shadow cursor-pointer text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={isOutOfStock(product)}
                    disabled={savingStockIds.includes(product.id)}
                    onChange={(e) => setProductOutOfStock(product.id, e.target.checked)}
                    className="w-3 h-3 accent-gray-700 mr-1 disabled:cursor-not-allowed"
                  />
                  {savingStockIds.includes(product.id) ? "..." : "Out of stock"}
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination BOTTOM */}
      {totalPages > 1 && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          pageNumbers={pageNumbers()}
          goToPage={goToPage}
        />
      )}

      {/* Product Details Modal */}
      <Dialog
        open={!!selectedProductId}
        onClose={() => setSelectedProductId(null)}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      >
        <Dialog.Panel className="bg-white rounded-lg p-6 w-[90%] md:w-[70%] max-h-[90vh] overflow-y-auto relative">
          <button onClick={() => setSelectedProductId(null)} className="absolute top-4 right-4 text-gray-500 hover:text-black">✕</button>
          {selectedProductId && <ProductDetails id={selectedProductId} />}
        </Dialog.Panel>
      </Dialog>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? "Modifier" : "Ajouter"} un Produit
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Nom" value={formData.name}
                onChange={(e) => setFormData((p: any) => ({ ...p, name: e.target.value }))}
                className="w-full border px-3 py-2 rounded" required />

              <input type="text" placeholder="Code" value={formData.code}
                onChange={(e) => setFormData((p: any) => ({ ...p, code: e.target.value }))}
                className="w-full border px-3 py-2 rounded" required />

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.outOfStock}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData((p: any) => ({
                        ...p,
                        outOfStock: checked,
                        stock: checked ? "0" : (Number(p.stock) <= 0 || p.stock === "" ? "10" : p.stock)
                      }));
                    }} />
                  Out of stock
                </label>
              </div>

              <input type="number" placeholder="Quantité en stock (0 = Out of stock)" value={formData.stock}
                onChange={(e) => {
                  const val = e.target.value;
                  const stockNum = val !== "" ? Number(val) : null;
                  const isOut = stockNum !== null && stockNum <= 0;
                  setFormData((p: any) => ({
                    ...p,
                    stock: val,
                    outOfStock: isOut
                  }));
                }}
                className="w-full border px-3 py-2 rounded" min="0" />

              <input type="number" placeholder="Prix Initial (TTC)" value={formData.originalPrice}
                onChange={(e) => setFormData((p: any) => ({ ...p, originalPrice: e.target.value }))}
                className="w-full border px-3 py-2 rounded" required />

              <input type="number" placeholder="Taux TVA (ex: 19, 13, 7, 0)" value={formData.tva}
                onChange={(e) => setFormData((p: any) => ({ ...p, tva: e.target.value }))}
                className="w-full border px-3 py-2 rounded" min="0" max="100" step="1" />


              <input type="file" onChange={(e) =>
                setFormData((p: any) => ({ ...p, image_file: e.target.files ? e.target.files[0] : null }))
              } className="w-full border px-3 py-2 rounded" />

              <select value={formData.category_id}
                onChange={(e) => setFormData((p: any) => ({ ...p, category_id: Number(e.target.value) }))}
                className="w-full border px-3 py-2 rounded" required>
                <option value="">Sélectionnez une Catégorie</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 border rounded hover:bg-gray-50">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  {editingProduct ? "Mettre à Jour" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Pagination Bar Component ───────────────────────────────────────────────
interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  pageNumbers: (number | "...")[];
  goToPage: (page: number) => void;
}

const PaginationBar: React.FC<PaginationBarProps> = ({ currentPage, totalPages, pageNumbers, goToPage }) => (
  <div className="flex items-center justify-center gap-1 flex-wrap py-2">
    {/* First */}
    <button
      onClick={() => goToPage(1)}
      disabled={currentPage === 1}
      className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
      title="Première page"
    >
      <ChevronsLeft className="w-4 h-4" />
    </button>

    {/* Prev */}
    <button
      onClick={() => goToPage(currentPage - 1)}
      disabled={currentPage === 1}
      className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
      title="Page précédente"
    >
      <ChevronLeft className="w-4 h-4" />
    </button>

    {/* Page numbers */}
    {pageNumbers.map((page, i) =>
      page === "..." ? (
        <span key={`ellipsis-${i}`} className="px-2 py-1 text-gray-400 select-none">…</span>
      ) : (
        <button
          key={page}
          onClick={() => goToPage(page as number)}
          className={`w-9 h-9 rounded text-sm font-medium transition ${
            currentPage === page
              ? "bg-blue-600 text-white shadow"
              : "hover:bg-gray-100 text-gray-700"
          }`}
        >
          {page}
        </button>
      )
    )}

    {/* Next */}
    <button
      onClick={() => goToPage(currentPage + 1)}
      disabled={currentPage === totalPages}
      className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
      title="Page suivante"
    >
      <ChevronRight className="w-4 h-4" />
    </button>

    {/* Last */}
    <button
      onClick={() => goToPage(totalPages)}
      disabled={currentPage === totalPages}
      className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
      title="Dernière page"
    >
      <ChevronsRight className="w-4 h-4" />
    </button>

    {/* Quick jump */}
    <div className="flex items-center gap-1 ml-3 text-sm text-gray-500">
      <span>Aller à</span>
      <input
        type="number"
        min={1}
        max={totalPages}
        defaultValue={currentPage}
        key={currentPage}
        onKeyDown={(e) => {
          if (e.key === "Enter") goToPage(Number((e.target as HTMLInputElement).value));
        }}
        className="border rounded w-14 px-2 py-1 text-center text-sm"
      />
    </div>
  </div>
);
