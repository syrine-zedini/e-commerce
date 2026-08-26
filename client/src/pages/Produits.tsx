import {
  ChevronDownIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShoppingCartIcon,
} from "lucide-react";
import { convertImageUrl, onImgError } from "@/lib/imageUtils";
import React, { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "react-hot-toast";

import { Link, useLocation, useSearch } from "wouter";
import { apiGet, fetchAllProducts } from "@/lib/api";
import Header from "@/components/Header";
import { MobileHeader } from "@/components/MobileHeader";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartProvider";
import { HEADER_LINKS, NAVIGATION_ITEMS, SERVICE_FEATURES, FOOTER_SECTIONS } from "@/lib/pageData";
import { isProductAvailable, showToast } from "@/lib/productUtils";
import { useProductCategories } from "@/hooks/useProductCategories";
import { usePagination } from "@/hooks/usePagination";
type Product = {
  id: number;
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
  popular?: boolean;
  promo?: boolean;
  stock_status?: string | null;
  form?: string | null;
  tva?: string | number | null;
};

function useQuery() {
  const search = useSearch();
  return React.useMemo(() => {
    return new URLSearchParams(search);
  }, [search]);
}

interface BrandCount {
  name: string;
  count: number;
}

export const Produits = (): JSX.Element => {
  const [, setLocation] = useLocation();
  const query = useQuery();
  const [products, setProducts] = useState<Product[]>([]);
  // const [loading, setLoading] = useState(true);
  const { cart, addToCart: ctxAddToCart } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const productCategories = useProductCategories();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    (window.history.state as any)?.category || null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [, setBrands] = useState<BrandCount[]>([]);
  const [selectedBrand] = useState<string | null>(null);

  // States for searchable category dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [categorySearchVal, setCategorySearchVal] = useState("");
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const [, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        // Reset search input value to selected category name
        if (selectedCategory) {
          const currentCat = productCategories.find(c => c.id === selectedCategory);
          setCategorySearchVal(currentCat ? currentCat.name : "");
        } else {
          setCategorySearchVal("");
        }
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedCategory, productCategories]);

  useEffect(() => {
    if (selectedCategory) {
      const currentCat = productCategories.find(c => c.id === selectedCategory);
      setCategorySearchVal(currentCat ? currentCat.name : "");
    } else {
      setCategorySearchVal("");
    }
  }, [selectedCategory, productCategories]);

// Quantities state (per product)
const [quantities, setQuantities] = useState<Record<number, number>>({});
const getQty = (id: number) => quantities[id] ?? 1;
const changeQty = (id: number, delta: number, product?: any) => {
  const stockVal = product?.form != null && product?.form !== "" ? Number(product.form) : null;
  const maxOrderable = stockVal !== null && !isNaN(stockVal) ? stockVal : Infinity;
  setQuantities((prev) => {
    const current = prev[id] ?? 1;
    const next = current + delta;
    if (delta > 0 && next > maxOrderable) {
      toast.error(
        `Stock insuffisant ! Maximum ${maxOrderable} unité${maxOrderable > 1 ? 's' : ''} commandable${maxOrderable > 1 ? 's' : ''}.`,
        { style: { borderRadius: "10px", background: "#333", color: "#fff" } }
      );
      return prev;
    }
    return { ...prev, [id]: Math.max(1, next) };
  });
};
// Pagination state
const productsPerPage = 24;


 useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    // Fetch all products
    let data: any[] | null = null;
    try {
      data = await apiGet("/api/products?activeOnly=1&inStockOnly=1&withPriceOnly=1&fields=brand,stock_status");
    } catch (error) {
      console.error("Error fetching products:", error);
      return;
    }

    if (data) {
      // Count products by brand
      const brandMap: Record<string, number> = {};
      data.filter(isProductAvailable).forEach((product: any) => {
        const brandName = product.brand || "Unknown";
        brandMap[brandName] = (brandMap[brandName] || 0) + 1;
      });

      // Convert to array
      const brandArray: BrandCount[] = Object.entries(brandMap).map(
        ([name, count]) => ({ name, count })
      );

      setBrands(brandArray);
    }
  };
  useEffect(() => {
    const searchParam = query.get("search");
    if (searchParam) {
      setSearchQuery(searchParam);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setSearchQuery("");
    }
  }, [query]);

  useEffect(() => {
    const categoryId = query.get("category");
    const catName = query.get("cat");

    if (categoryId) {
      const parsedCategoryId = Number(categoryId);
      setSelectedCategory(Number.isNaN(parsedCategoryId) ? null : parsedCategoryId);
      // Scroll to top so user sees filtered results immediately
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (catName) {
      if (productCategories.length > 0) {
        const normalizedCatName = catName.toLowerCase().trim();
        const found = productCategories.find(
          (c) => c.name.toLowerCase().trim() === normalizedCatName
        );
        setSelectedCategory(found ? found.id : null);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setSelectedCategory(null);
    }
  }, [productCategories, query]);

const headerLinks = HEADER_LINKS;
  const navigationItems = NAVIGATION_ITEMS;

  const features = SERVICE_FEATURES;

 const footerSections = FOOTER_SECTIONS;


    const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5; // speed factor
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  // For touch devices
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };
  
  // Auto-scroll categories on Products page (right -> left)
  const [isAutoScrollingPaused, setIsAutoScrollingPaused] = useState(false);
  const autoScrollTimeoutRef = useRef<any>(null);

  const handleArrowScroll = (direction: "left" | "right") => {
    setIsAutoScrollingPaused(true);
    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
    }
    
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }

    autoScrollTimeoutRef.current = setTimeout(() => {
      setIsAutoScrollingPaused(false);
    }, 4000);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let rafId = 0 as number;
    let lastTime = performance.now();
    const speedPxPerSec = 100; // match Home speed

    const step = (time: number) => {
      const dt = Math.min(100, time - lastTime) / 1000;
      lastTime = time;
      if (!isAutoScrollingPaused && !isDragging) {
        const delta = speedPxPerSec * dt;
        el.scrollLeft = Math.min(el.scrollLeft + delta, el.scrollWidth - el.clientWidth);
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) {
          el.scrollLeft = 0;
        }
      }
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isAutoScrollingPaused, isDragging, productCategories]);
  
  //  Single effect for fetching products + categories + images
 useEffect(() => {
    const fetchProducts = async () => {
      let allProducts: Product[] = [];

      try {
        const data = await fetchAllProducts("/api/products?activeOnly=1&inStockOnly=1&withPriceOnly=1");
        allProducts = ((data || []) as Product[]).filter(isProductAvailable);
      } catch (error: any) {
        console.error("Erreur lors de la récupération des produits :", error?.message || error);
      }

      setProducts(allProducts.filter(isProductAvailable));
    };

    fetchProducts();
  }, []);

  // ✅ cart function
const addToCart = (product: any, qty: number = 1) => {
  const stockVal = product.form != null && product.form !== "" ? Number(product.form) : null;
  const maxOrderable = stockVal !== null && !isNaN(stockVal) ? stockVal : null;
  const currentInCart = (cart as any[]).find((i: any) => String(i.id) === String(product.id))?.quantity || 0;
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
  ctxAddToCart({ ...product, quantity: qty, tva: product.tva ?? product.discount_percentage });
  showToast('Produit ajouté au panier !');
};

const filteredProducts = products
  .filter((p) => {
    const categoryMatch = selectedCategory
      ? Number(p.category_id) === Number(selectedCategory)
      : true;
    const brandMatch = selectedBrand ? p.brand === selectedBrand : true;
    const stockMatch = isProductAvailable(p);
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
    return categoryMatch && nameMatch && brandMatch && stockMatch;
  })
  // ✅ Products WITH image first, WITHOUT image last
  .sort((a, b) => {
    const aHasImg = a.image_path && a.image_path.trim() !== "" ? 0 : 1;
    const bHasImg = b.image_path && b.image_path.trim() !== "" ? 0 : 1;
    return aHasImg - bHasImg;
  });

const { currentPage, setCurrentPage, currentItems: currentProducts, totalPages, goToPage, getPageNumbers } = usePagination(filteredProducts, productsPerPage);

// Calculate current page products
const indexOfLastProduct = currentPage * productsPerPage;
const indexOfFirstProduct = indexOfLastProduct - productsPerPage;

// Reset to first page when filtered results change
useEffect(() => {
  setCurrentPage(1);
}, [filteredProducts.length]);


return (
    <div className="bg-white min-h-screen">

      {/* Header */}
      <div className="hidden md:block">
        <Header
          headerLinks={headerLinks}
          navigationItems={navigationItems}
          isCartOpen={isCartOpen}
          setIsCartOpen={setIsCartOpen}
        />
      </div>
      <div className="block md:hidden">
        <MobileHeader navLinks={headerLinks} />
      </div>

      {/* Hero Section */}
      <section className="w-full h-[200px] relative overflow-hidden">
        <img
          src="/figmaAssets/brand/banners/cosmetic-2.jpg"
          alt="Glow Store"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </section>

      {/* Categories Section */}
      <section className="py-14 bg-white relative group">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Left Arrow */}
          <button
            onClick={() => handleArrowScroll("left")}
            className="absolute left-0 md:-left-12 top-[30%] sm:top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-11 md:h-11 rounded-full bg-white border border-slate-200/80 shadow-md hover:shadow-lg active:scale-95 hover:scale-105 transition-all duration-300 flex items-center justify-center text-slate-600 hover:text-[#C86D85] focus:outline-none cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => handleArrowScroll("right")}
            className="absolute right-0 md:-right-12 top-[30%] sm:top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-11 md:h-11 rounded-full bg-white border border-slate-200/80 shadow-md hover:shadow-lg active:scale-95 hover:scale-105 transition-all duration-300 flex items-center justify-center text-slate-600 hover:text-[#C86D85] focus:outline-none cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          <div
            ref={scrollRef}
            className="flex space-x-6 lg:space-x-12 overflow-x-auto pb-4 px-10 md:px-0 scrollbar-hide cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseEnter={() => setIsAutoScrollingPaused(true)}
            onMouseLeave={() => setIsAutoScrollingPaused(false)}
            onMouseUp={handleMouseLeaveOrUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleMouseLeaveOrUp}
            onTouchMove={handleTouchMove}
          >
            {productCategories.map((category) => (
              <div
                key={category.id}
                className="flex-shrink-0 text-center cursor-pointer group/item"
                onClick={() => {
                  if (selectedCategory === category.id) {
                    setLocation("/products");
                  } else {
                    setLocation(`/products?category=${category.id}`);
                  }
                }}
              >
                <div className={`relative w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 mx-auto transition-all duration-400 ease-[cubic-bezier(0.25,0.8,0.25,1)] filter hover:scale-105 ${
                  selectedCategory === category.id ? "drop-shadow-[0_0_10px_rgba(216,138,158,0.6)]" : "drop-shadow-sm hover:drop-shadow-md"
                }`}>
                  <div className="w-full h-full clip-octagon overflow-hidden bg-white">
                    {category.image ? (
                      <img
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-105"
                        alt={category.name}
                        src={category.image}
                        onError={onImgError}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100">
                        <span className="text-2xl sm:text-3xl font-black text-[#C86D85] uppercase select-none">
                          {category.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className={`mt-4 font-semibold text-[10px] sm:text-xs lg:text-sm uppercase tracking-wider transition-colors max-w-[100px] sm:max-w-[140px] mx-auto leading-tight ${
                  selectedCategory === category.id ? "text-[#C86D85]" : "text-slate-700 group-hover/item:text-[#C86D85]"
                }`}>
                  {category.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex flex-col gap-4 sm:gap-8 px-4 sm:px-6 md:px-[84px] py-8">
        <div className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-100/80 mb-2 grid grid-cols-2 gap-4 items-end">
          {/* Categories Filter (Searchable Dropdown) */}
          <div className="w-full relative" ref={categoryDropdownRef}>
            <h3 className="text-[11px] sm:text-sm font-semibold text-slate-700 mb-2.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#C86D85] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="truncate">Catégories</span>
            </h3>
            
            <div className="relative">
              <input
                type="text"
                value={categorySearchVal}
                onFocus={() => {
                  setIsDropdownOpen(true);
                  setCategorySearchVal("");
                }}
                onChange={(e) => {
                  setCategorySearchVal(e.target.value);
                  setIsDropdownOpen(true);
                }}
                placeholder={
                  selectedCategory 
                    ? (productCategories.find(c => c.id === selectedCategory)?.name || "Toutes") 
                    : "Toutes"
                }
                className="w-full h-9 sm:h-11 px-3 py-2 pr-8 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C86D85] transition-all text-xs sm:text-sm font-medium cursor-pointer"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                <ChevronDownIcon className="h-4 w-4 text-slate-500" />
              </div>
            </div>

            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto p-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <div
                  onClick={() => {
                    setLocation("/products");
                    setCategorySearchVal("");
                    setIsDropdownOpen(false);
                  }}
                  className="px-3 py-2 text-xs sm:text-sm text-slate-700 hover:bg-rose-50 hover:text-[#C86D85] rounded-lg cursor-pointer font-medium transition-colors"
                >
                  Toutes
                </div>
                {productCategories
                  .filter((cat) =>
                    cat.name.toLowerCase().includes(categorySearchVal.toLowerCase())
                  )
                  .map((category) => (
                    <div
                      key={category.id}
                      onClick={() => {
                        setLocation(`/products?category=${category.id}`);
                        setCategorySearchVal(category.name);
                        setIsDropdownOpen(false);
                      }}
                      className={`px-3 py-2 text-xs sm:text-sm rounded-lg cursor-pointer font-medium transition-colors flex items-center justify-between ${
                        selectedCategory === category.id
                          ? "bg-rose-50 text-[#C86D85]"
                          : "text-slate-700 hover:bg-slate-50 hover:text-[#C86D85]"
                      }`}
                    >
                      <span>{category.name}</span>
                      {selectedCategory === category.id && (
                        <span className="text-[#C86D85] font-bold">✓</span>
                      )}
                    </div>
                  ))}
                {productCategories.filter((cat) =>
                  cat.name.toLowerCase().includes(categorySearchVal.toLowerCase())
                ).length === 0 && (
                  <div className="px-3 py-2 text-xs text-slate-400 text-center font-medium">
                    Aucune catégorie trouvée
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search Filter */}
          <div className="w-full">
            <h3 className="text-[11px] sm:text-sm font-semibold text-slate-700 mb-2.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#C86D85] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="truncate">Recherche</span>
            </h3>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un produit..."
                className="w-full h-9 sm:h-11 pl-3 pr-9 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C86D85] transition-all text-xs sm:text-sm font-medium"
                style={{ paddingRight: searchQuery.trim().length > 0 ? "70px" : "40px" }}
              />
              {searchQuery.trim().length > 0 && (
                <>
                  <span className="absolute right-16 top-1/2 transform -translate-y-1/2 text-xs font-bold text-[#C86D85] bg-[#F7F0DC] px-2.5 py-0.5 rounded-full pointer-events-none">
                    {filteredProducts.length}
                  </span>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </>
              )}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <section className="flex-1">
          {/* Controls + Top Pagination */}
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium">
                {filteredProducts.length.toLocaleString()} produit{filteredProducts.length > 1 ? "s" : ""}
              </span>
              <span className="text-xs text-slate-400">
                Page {currentPage} / {Math.max(1, totalPages)}
                {" · "}Affichage {Math.min(indexOfFirstProduct + 1, filteredProducts.length)}–{Math.min(indexOfLastProduct, filteredProducts.length)}
              </span>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 flex-wrap">
                <button onClick={() => goToPage(1)} disabled={currentPage === 1}
                  className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                ><ChevronsLeft className="w-4 h-4 text-slate-600" /></button>
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                  className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                ><ChevronLeft className="w-4 h-4 text-slate-600" /></button>
                {getPageNumbers().map((page, i) =>
                  page === "..." ? (
                    <span key={`el-${i}`} className="px-2 text-slate-400 select-none">…</span>
                  ) : (
                    <button key={page} onClick={() => goToPage(page as number)}
                      className={`w-9 h-9 rounded-full text-sm font-semibold transition ${
                        currentPage === page
                          ? "bg-[#C86D85] text-white shadow-md"
                          : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >{page}</button>
                  )
                )}
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                  className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                ><ChevronRight className="w-4 h-4 text-slate-600" /></button>
                <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}
                  className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                ><ChevronsRight className="w-4 h-4 text-slate-600" /></button>
              </div>
            )}
          </div>

          {/* Products GridIcon */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8 mb-8">
            {currentProducts.map((product, index) => {
              const isLastAndOdd = index === currentProducts.length - 1 && currentProducts.length % 2 !== 0;
              return (
                <div
                  key={product.id}
                  className={`block h-full group ${
                    isLastAndOdd
                      ? "col-span-2 justify-self-center w-full max-w-[calc(50%-0.375rem)] sm:col-span-1 sm:max-w-none"
                      : ""
                  }`}
                >
                  <Link to={`/detailsprod/${product.id}`} className="block h-full">
                    <Card className="bg-white rounded-2xl border border-slate-100/80 hover:border-[#C86D85]/20 hover:shadow-card hover:-translate-y-1 transition-all duration-400 ease-[cubic-bezier(0.25,0.8,0.25,1)] h-full flex flex-col overflow-hidden">
                      <CardContent className="p-2.5 sm:p-4 flex flex-col h-full">
                        {/* Badges */}
                        <div className="flex gap-1 mb-2 flex-wrap">
                          {product.popular && (
                            <Badge className="h-5 px-1.5 text-[8px] sm:h-5.5 sm:px-2 sm:text-[9px] uppercase font-bold tracking-wider rounded-md">
                              Populaire
                            </Badge>
                          )}
                          {product.promo && (
                            <Badge className="h-5 px-1.5 text-[8px] sm:h-5.5 sm:px-2 sm:text-[9px] uppercase font-bold tracking-wider rounded-md bg-rose-50 text-rose-600">
                              Soldes
                            </Badge>
                          )}
                        </div>

                        {/* Image */}
                        <div className="relative mb-2 flex-shrink-0 bg-gradient-to-b from-slate-50/80 to-slate-100/30 rounded-xl p-2 sm:p-4 flex items-center justify-center h-32 sm:h-44 overflow-hidden">
                          <img
                            className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500"
                            alt={product.name}
                            src={convertImageUrl(product.image_path)}
                            onError={onImgError}
                            loading="lazy"
                            decoding="async"
                          />
                        </div>

                        {/* Brand */}
                        {product.brand && (
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                            {product.brand}
                          </span>
                        )}

                        {/* Name */}
                        <h3 className="font-semibold text-slate-700 text-xs sm:text-sm mb-2 line-clamp-2 hover:text-[#C86D85] transition-colors h-8 sm:h-10">
                          {product.name}
                        </h3>

                        {/* Category */}
                        <div className="flex gap-1 mb-3 flex-wrap">
                          {product.category_id && (
                            <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-0.5 bg-[#FBF6E8] text-[#C86D85] rounded-md text-[8px] sm:text-[9px] font-bold uppercase tracking-widest border border-[#C86D85]/20">
                              {productCategories.find((cat) => cat.id === product.category_id)?.name || "Catégorie"}
                            </span>
                          )}
                        </div>

                        {/* Price + Quantity + Button */}
                        <div className="mt-auto pt-3 border-t border-slate-100 flex flex-col gap-2">
                          {/* Price */}
                          <div className="flex flex-col">
                            {!!product.original_price && !!product.discounted_price && product.discounted_price < product.original_price && (
                              <span className="font-medium text-slate-400 text-[9px] sm:text-xs line-through leading-none mb-1">
                                {product.original_price}&nbsp;DT
                              </span>
                            )}
                            <span className="font-extrabold text-[#C86D85] text-sm sm:text-base leading-none whitespace-nowrap">
                              {(product.discounted_price && product.discounted_price > 0 ? product.discounted_price : product.original_price)}&nbsp;DT
                            </span>
                          </div>
                          {/* Quantity + Cart */}
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center bg-slate-50 border border-slate-200/60 rounded-lg p-0.5 shadow-sm">
                              <button
                                onClick={(e) => { e.preventDefault(); changeQty(product.id, -1, product); }}
                                className="w-5 h-5 rounded-full text-slate-500 hover:text-[#C86D85] hover:bg-white flex items-center justify-center text-xs font-bold transition"
                              >−</button>
                              <span className="w-6 text-center text-[10px] sm:text-xs font-semibold text-slate-700">{getQty(product.id)}</span>
                              <button
                                onClick={(e) => { e.preventDefault(); changeQty(product.id, 1, product); }}
                                className="w-5 h-5 rounded-full text-slate-500 hover:text-[#C86D85] hover:bg-white flex items-center justify-center text-xs font-bold transition"
                              >+</button>
                            </div>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                addToCart(product, getQty(product.id));
                              }}
                              className="relative flex-1 group/btn h-[28px] sm:h-[32px] bg-gradient-to-r from-[#C86D85] to-[#E8A5B8] hover:from-[#C86D85] hover:to-[#D88A9E] rounded-lg flex items-center justify-center transition-all duration-300 shadow-[0_4px_10px_rgba(216,138,158,0.2)] hover:shadow-[0_6px_15px_rgba(216,138,158,0.3)] hover:-translate-y-0.5 overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
                              <div className="flex items-center gap-1 relative z-10">
                                <ShoppingCartIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                                <span className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-wider">Ajouter</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Bottom Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 flex-wrap mt-6 mb-4">
              <button onClick={() => goToPage(1)} disabled={currentPage === 1}
                className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              ><ChevronsLeft className="w-4 h-4 text-slate-600" /></button>
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              ><ChevronLeft className="w-4 h-4 text-slate-600" /></button>
              {getPageNumbers().map((page, i) =>
                page === "..." ? (
                  <span key={`elb-${i}`} className="px-2 text-slate-400 select-none">…</span>
                ) : (
                  <button key={page} onClick={() => goToPage(page as number)}
                    className={`w-9 h-9 rounded-full text-sm font-semibold transition ${
                      currentPage === page
                        ? "bg-[#C86D85] text-white shadow-md"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >{page}</button>
                )
              )}
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              ><ChevronRight className="w-4 h-4 text-slate-600" /></button>
              <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}
                className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              ><ChevronsRight className="w-4 h-4 text-slate-600" /></button>
            </div>
          )}

        </section>
      </main>

      {/* Service features (same style as Home) */}
      <section className="py-20 bg-gray-100 border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon as any;
              return (
                <Link key={index} to={feature.link} className="block cursor-pointer">
                  <Card className="bg-white rounded-2xl border border-slate-100/80 hover:shadow-card hover:border-[#C86D85]/15 hover:-translate-y-1 transition-all duration-400 ease-[cubic-bezier(0.25,0.8,0.25,1)] group h-full">
                    <CardContent className="p-7 sm:p-8 flex items-center space-x-5 sm:space-x-6 h-full">
                      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-sm ${feature.bgClass}`}>
                        <Icon className="w-8 h-8 sm:w-10 sm:h-10 transition-transform duration-300 group-hover:scale-110" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 text-base sm:text-lg mb-2 group-hover:text-[#C86D85] transition-colors leading-snug">
                          {feature.title}
                        </h3>
                        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
       <Footer footerSections={footerSections} />

    </div>
  );
};
