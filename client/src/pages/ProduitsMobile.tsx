import { ChevronLeftIcon, ChevronRightIcon, ChevronsLeft, ChevronsRight, Filter, ShoppingCartIcon } from "lucide-react";
import { convertImageUrl, onImgError } from "@/lib/imageUtils";
import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FooterMobile } from "@/components/ui/FooterMobile";
import { MobileHeader } from "@/components/MobileHeader";
import { apiGet, fetchAllProducts } from "@/lib/api";
import { useSearch } from "wouter";
import { navigate } from "wouter/use-browser-location";
import { toast } from "react-hot-toast";
import { HEADER_LINKS, toMobileFooterSections } from "@/lib/pageData";
import { isProductAvailable, showToast } from "@/lib/productUtils";
import { usePagination } from "@/hooks/usePagination";
import { useQuantityManager } from "@/hooks/useQuantityManager";

function useQuery() {
  const search = useSearch();
  return React.useMemo(() => {
    return new URLSearchParams(search);
  }, [search]);
}



const footerSections = toMobileFooterSections();

type Product = {  id: number;
  code: string;
  name: string;
  category_id: number;
  description: string;
  image_path: string;
  original_price: number;
  discount_percentage: number;
  discounted_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  imageUrl?: string | null;
  brand?: string | null;
  stock_status?: string | null;
  form?: string | null;
  tva?: string | number | null;
};

export const ProduitsMobile = (): JSX.Element => {
  const query = useQuery();
  const navLinks = HEADER_LINKS;
const [cart, setCart] = useState<any[]>([]);
  const [productCategories, setProductCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null); // null = show all
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
const { getQty, changeQty } = useQuantityManager();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
const [searchQuery, setSearchQuery] = useState("");
const [selectedBrand] = useState<string | null>(null);

const [, setShowSuggestions] = useState(false);
const searchRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
      setShowSuggestions(false);
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

const productsPerPage = 24;

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);

    let allProducts: Product[] = [];

    try {
      const data = await fetchAllProducts("/api/products?activeOnly=1&inStockOnly=1&withPriceOnly=1");
      allProducts = ((data || []) as Product[]).filter(isProductAvailable);
    } catch (error: any) {
      console.error("Error fetching products:", error?.message || error);
    }

    setProducts(allProducts);

    // fetch categories
    try {
      const categories = await apiGet("/api/categories");
      if (categories) {
        console.log("Fetched categories:", categories);
        setProductCategories(categories);
      }
    } catch (catError: any) {
      console.error("Error fetching categories:", catError?.message || catError);
    }
    setLoading(false);
  };

  fetchData();
}, []);

// Read ?category= URL param and set selectedCategory
useEffect(() => {
  const categoryId = query.get("category");
  if (categoryId) {
    const parsed = Number(categoryId);
    setSelectedCategory(Number.isNaN(parsed) ? null : parsed);
  } else {
    setSelectedCategory(null);
  }
}, [query]);

// Read ?search= URL param (from header search) and apply it
useEffect(() => {
  const searchParam = query.get("search");
  if (searchParam) {
    setSearchQuery(searchParam);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}, [query]);


// Filtered products — WITH image first, WITHOUT image last
const filteredProducts = products
  .filter((p) => {
    const categoryMatch = selectedCategory
      ? Number(p.category_id) === Number(selectedCategory)
      : true;
    const brandMatch = selectedBrand ? p.brand === selectedBrand : true;
    const normalize = (str: string) =>
      str
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase() || "";
    const q = normalize(searchQuery);
    const haystack = normalize(`${p.name ?? ""} ${p.brand ?? ""}`);
    const nameMatch = q
      ? q.split(" ").every(word => haystack.includes(word))
      : true;
    return categoryMatch && brandMatch && nameMatch;
  })
  .sort((a, b) => {
    const aHas = a.image_path && a.image_path.trim() !== "" ? 0 : 1;
    const bHas = b.image_path && b.image_path.trim() !== "" ? 0 : 1;
    return aHas - bHas;
  });

const { currentPage, currentItems: paginatedProducts, totalPages, goToPage, getPageNumbers } = usePagination(filteredProducts, productsPerPage);

const addToCart = (product: Product | any, qty: number = 1) => {
  const stockVal = product.form != null && product.form !== "" ? Number(product.form) : null;
  const maxOrderable = stockVal !== null && !isNaN(stockVal) ? stockVal - 3 : null;
  const exists = cart.find((item) => item.id === product.id);
  const currentInCart = exists ? (exists.quantity || 1) : 0;
  if (maxOrderable !== null && currentInCart + qty > maxOrderable) {
    const remaining = Math.max(0, maxOrderable - currentInCart);
    toast.error(
      remaining > 0
        ? `Stock insuffisant ! Il reste ${remaining} unité${remaining > 1 ? 's' : ''} disponible${remaining > 1 ? 's' : ''}.`
        : `Stock insuffisant pour ce produit.`,
      { style: { borderRadius: "10px", background: "#333", color: "#fff" } }
    );
    return;
  }
  if (exists) {
    showToast("Produit déjà dans le panier !");
    return;
  }

  setCart((prev) => {
    const newCart = [
      ...prev,
      {
        ...product,
        quantity: qty,
        discounted_price: Number(product.discounted_price) || 0,
        original_price: Number(product.original_price) || 0,
        tva: product.tva ?? product.discount_percentage,
      },
    ];
    console.log("Updated cart:", newCart);
    return newCart;
  });

  showToast("Produit ajouté au panier !");
};

  return (
    <div className="bg-white grid justify-items-center w-screen">
      <div className="bg-white overflow-hidden w-[375px] min-h-screen relative">
        <MobileHeader navLinks={navLinks} />

        {/* Hero Section */}
        <div
          className="relative w-full h-40 bg-cover bg-center"
          style={{ backgroundImage: "url(/figmaAssets/productsm/rectangle-230.png)" }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-app-secondary to-transparent" />
          <div className="absolute bottom-6 left-3">
            <h1 className="text-text-light text-[21px] font-bold [font-family:'Inter',Helvetica] mb-2">
              Produits
            </h1>
            <div className="text-text-light text-xs font-medium [font-family:'Inter',Helvetica]">
              Accueil &gt; Produits
            </div>
          </div>
        </div>

        {/* Categories */}
<div className="px-3 py-6">
  <div className="w-full overflow-x-auto">
    <div className="flex gap-4 pb-4 flex-nowrap">
      {/* All categories button */}


      {/* Map categories */}
 {productCategories.map((category) => (
  <div
    key={category.id}
    className="flex-shrink-0 w-[121px] text-center cursor-pointer group"
    onClick={() => {
      if (selectedCategory === category.id) {
        navigate("/products");
      } else {
        navigate(`/products?category=${category.id}`);
      }
    }}
  >
    <div className={`relative w-[119px] h-[119px] mx-auto mb-2 transition-all duration-300 filter drop-shadow-sm hover:drop-shadow-md hover:scale-102`}>
      <div className="w-full h-full clip-octagon overflow-hidden bg-white relative">
        {category.image ? (
          <img
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            alt={category.name}
            src={category.image}
            onError={onImgError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
            <span className="text-xl font-black text-[#1D8EE6] uppercase select-none">
              {category.name.charAt(0)}
            </span>
          </div>
        )}
        {selectedCategory === category.id && (
          <div className="absolute inset-0 border-[3px] border-app-primary bg-app-primary/5 pointer-events-none" />
        )}
      </div>
    </div>
    <div className="text-black text-sm font-semibold [font-family:'Inter',Helvetica]">
      {category.name}
    </div>
  </div>
))}
    </div>
  </div>
</div>
{/* Filter Button (Visible on Mobile) */}
<div className="px-3 flex justify-end mb-4">
  <Button
    onClick={() => setIsFilterOpen(true)}
    className="bg-app-primary text-white font-semibold rounded-[24px] text-sm py-2 px-5"
  >
     <Filter className="w-4 h-4" />

    Filtres
  </Button>
</div>
{/* Filter Modal (Drawer) */}
{isFilterOpen && (
  <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-end">
    <div className="bg-white w-full rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-black">Filtres</h3>
        <button
          onClick={() => setIsFilterOpen(false)}
          className="text-gray-500 text-2xl font-bold"
        >
          ×
        </button>
      </div>

      {/* --- Categories --- */}
      <div className="mb-6">
        <h4 className="font-semibold text-black mb-2 text-sm">Catégories</h4>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
          <div
            onClick={() => navigate("/products")}
            className={`px-3 py-1.5 border rounded-full text-xs font-medium cursor-pointer transition-colors ${
              selectedCategory === null
                ? "border-app-primary bg-app-primary text-white"
                : "border-gray-200 text-gray-700 bg-white"
            }`}
          >
            Toutes
          </div>
          {productCategories.map((category) => (
            <div
              key={category.id}
              onClick={() => navigate(`/products?category=${category.id}`)}
              className={`px-3 py-1.5 border rounded-full text-xs font-medium cursor-pointer transition-colors ${
                selectedCategory === category.id
                  ? "border-app-primary bg-app-primary text-white"
                  : "border-gray-200 text-gray-700 bg-white"
              }`}
            >
              {category.name}
            </div>
          ))}
        </div>
      </div>

      {/* --- Search Filter --- */}
      <div className="mb-6">
        <h4 className="font-semibold text-black text-sm mb-3">Recherche</h4>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full h-11 pl-4 pr-10 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-app-primary transition-all text-sm font-medium"
            style={{ paddingRight: searchQuery.trim().length > 0 ? "70px" : "40px" }}
          />
          {searchQuery.trim().length > 0 && (
            <span className="absolute right-10 top-1/2 transform -translate-y-1/2 text-xs font-bold text-app-primary bg-blue-50 px-2.5 py-0.5 rounded-full pointer-events-none">
              {filteredProducts.length}
            </span>
          )}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* --- Apply Filters Button --- */}
      <Button
        onClick={() => {
          setIsFilterOpen(false);
        }}
        className="w-full bg-app-primary hover:bg-app-primary/95 text-white rounded-[24px] py-3 font-semibold text-sm transition-colors"
      >
        Appliquer les filtres
      </Button>
    </div>
  </div>
)}

        {/* Products Grid */}
   <div className="px-3 space-y-6">
      {loading ? (
        <div className="text-center py-10">Chargement...</div>
      ) : paginatedProducts.length === 0 ? (
        <div className="text-center py-10">Aucun produit disponible</div>
      ) : (
        <>
          {/* Products */}
{/* React-hot-toast handles toast notifications */}

{paginatedProducts.map((product) => (
  <Card
    key={product.id}
    className="bg-card-background rounded-[5px] border-0 cursor-pointer"
    onClick={() => navigate(`/detailsprod/${product.id}`)}
  >
    <CardContent className="p-4 relative">
      <div className="flex justify-center mb-4">
        <img
          className="w-[200px] h-[200px] object-contain"
          alt={product.name}
          src={convertImageUrl(product.image_path)}
          onError={onImgError}
          loading="lazy"
          decoding="async"
        />
      </div>
      <p className="text-text-dark text-sm font-semibold [font-family:'Inter',Helvetica] mb-2">
        {product.name}
      </p>
    <div className="flex justify-between items-center">
  <div className="flex items-center gap-2">
    {product.original_price &&
      product.discounted_price &&
      product.discounted_price < product.original_price && (
        <span className="font-extrabold text-[#b3b3b3] text-sm line-through">
          {product.original_price} DT
        </span>
      )}
    <span className="font-extrabold text-app-secondary text-base">
      {product.discounted_price && product.discounted_price > 0
        ? product.discounted_price
        : product.original_price} DT
    </span>
  </div>

  <div className="flex items-center justify-between gap-1 w-full mt-3">
    <div className="flex items-center bg-slate-50 border border-slate-200/60 rounded-lg p-0.5 shadow-sm" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
      <button
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); changeQty(product.id, -1); }}
        className="w-5 h-5 rounded-full text-slate-500 hover:text-[#1D8EE6] hover:bg-white flex items-center justify-center text-xs font-bold transition"
      >−</button>
      <span className="w-6 text-center text-[10px] font-semibold text-slate-700">{getQty(product.id)}</span>
      <button
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); changeQty(product.id, 1); }}
        className="w-5 h-5 rounded-full text-slate-500 hover:text-[#1D8EE6] hover:bg-white flex items-center justify-center text-xs font-bold transition"
      >+</button>
    </div>
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        addToCart({
          ...product,
          original_price: Number(product.original_price) || 0,
          discounted_price: Number(product.discounted_price) || 0,
        }, getQty(product.id));
      }}
      className="relative flex-1 group/btn h-[32px] bg-gradient-to-r from-[#1D8EE6] to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg flex items-center justify-center transition-all duration-300 shadow-[0_4px_10px_rgba(29,142,230,0.15)] overflow-hidden"
    >
      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
      <div className="flex items-center gap-1 relative z-10">
        <ShoppingCartIcon className="w-3.5 h-3.5 text-white" />
        <span className="text-[10px] font-black text-white uppercase tracking-wider">Ajouter</span>
      </div>
    </button>
  </div>
</div>

    </CardContent>
  </Card>
))}



          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-1 mt-6 mb-2">
              <button onClick={() => goToPage(1)} disabled={currentPage === 1}
                className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              ><ChevronsLeft className="w-4 h-4 text-slate-600" /></button>
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              ><ChevronLeftIcon className="w-4 h-4 text-slate-600" /></button>
              {getPageNumbers().map((page, i) =>
                page === "..." ? (
                  <span key={`el-${i}`} className="px-1 text-slate-400 select-none text-sm">…</span>
                ) : (
                  <button key={page} onClick={() => goToPage(page as number)}
                    className={`w-8 h-8 rounded-full text-xs font-semibold transition ${
                      currentPage === page
                        ? "bg-[#1D8EE6] text-white shadow"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >{page}</button>
                )
              )}
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              ><ChevronRightIcon className="w-4 h-4 text-slate-600" /></button>
              <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}
                className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              ><ChevronsRight className="w-4 h-4 text-slate-600" /></button>
            </div>
          )}

        </>
      )}
    </div>
        {/* Service Features */}
        {/* <div className="px-3 space-y-4 mb-8">
          {serviceFeatures.map((feature, index) => (
            <Card key={index} className="bg-card-background rounded-[5px] border-0">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-[71px] h-[72px] bg-text-light rounded-full flex items-center justify-center flex-shrink-0">
                    <img
                      className="max-w-[52px] max-h-[46px]"
                      alt={feature.title}
                      src={feature.icon}
                    />
                  </div>
                  <div>
                    <h3 className="text-text-dark text-sm font-semibold [font-family:'Inter',Helvetica] mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-text-dark text-[11px] [font-family:'Inter',Helvetica] leading-5">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div> */}


        {/* Footer */}
         <FooterMobile sections={footerSections} />
     
      </div>
    </div>
  );
};
  