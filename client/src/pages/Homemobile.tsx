import React, { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { apiGet, fetchAllProducts } from "@/lib/api";
import { FooterMobile } from "@/components/ui/FooterMobile";
import { MobileHeader } from "@/components/MobileHeader";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, ShoppingCartIcon, Sparkles } from "lucide-react";
import { convertImageUrl, onImgError } from "@/lib/imageUtils";
import { toast } from "react-hot-toast";
import { SERVICE_FEATURES, HEADER_LINKS } from "@/lib/pageData";
import { isProductAvailable, showToast } from "@/lib/productUtils";
import { useActivePromotion } from "@/hooks/useActivePromotion";
import { useGalleryImages } from "@/hooks/useGalleryImages";
import { useQuantityManager } from "@/hooks/useQuantityManager";
interface Conseil {
  id: number;
  title: string;
  date: string;
  image: string;
}
export const HomeMobile = (): JSX.Element => {


  const services = SERVICE_FEATURES;

  const { getQty, changeQty } = useQuantityManager();

  const [latestProducts, setLatestProducts] = useState<any[]>([]);
  const [specialOfferProducts, setSpecialOfferProducts] = useState<any[]>([]);
    const [bestSellingProducts, setBestSellingProducts] = useState<any[]>([]);
    const navLinks = HEADER_LINKS;
const [cart, setCart] = useState<any[]>(() => {
  try {
    const stored = typeof window !== 'undefined' ? localStorage.getItem("cart") : null;
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error(e);
    return [];
  }
});

useEffect(() => {
  localStorage.setItem("cart", JSON.stringify(cart));
}, [cart]);

    const [current, setCurrent] = useState(0);
  const [categories, setCategories] = useState<
    { id: number; name: string; image: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [, setblogPosts] = useState<Conseil[]>([]);
  const { timeLeft } = useActivePromotion();

    // Mouse and touch handlers
  const startDrag = (e: any) => {
    setIsDragging(true);
    const pageX = e.pageX || (e.touches && e.touches[0].pageX);
    if (scrollRef.current) {
      setStartX(pageX - (scrollRef.current as any).offsetLeft);
      setScrollLeft((scrollRef.current as any).scrollLeft);
    }
  };

  const stopDrag = () => setIsDragging(false);

  const onDrag = (e: any) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const pageX = e.pageX || (e.touches && e.touches[0].pageX);
    const x = pageX - (scrollRef.current as any).offsetLeft;
    const walk = (x - startX) * 1.2; // scroll speed factor
    (scrollRef.current as any).scrollLeft = scrollLeft - walk;
  };



  const fetchConseils = async () => {
    try {
      const data = await apiGet("/api/conseils?sort=id&order=asc&limit=3"); // fetch only the first 3 conseils
      setblogPosts(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchConseils();
  }, []);
useEffect(() => {
  fetchHomeData();
  fetchSpecialOfferProducts();
}, []);

const fetchHomeData = async () => {
  try {
    let allProducts: any[] = [];

    try {
      const data = await fetchAllProducts("/api/products?activeOnly=1&inStockOnly=1&withPriceOnly=1");
      allProducts = (data || []).filter(isProductAvailable);
    } catch (err: any) {
      console.error("Error fetching products:", err?.message || err);
    }

    let categories: any[] = [];
    try {
      categories = await apiGet("/api/categories");
    } catch (catError: any) {
      console.error("❌ Error fetching categories:", catError?.message || catError);
    }

    const filteredList = allProducts.filter(
      (product) =>
        product &&
        product.is_active !== false &&
        product.id !== 10046 &&
        product.name !== "SANSEL 60GR (SEL DIETETIQUE)"
    );

    // Sort: products with image go first, products without image go last
    filteredList.sort((a, b) => {
      const aHasImage = a.image_path && a.image_path !== "";
      const bHasImage = b.image_path && b.image_path !== "";
      if (aHasImage && !bHasImage) return -1;
      if (!aHasImage && bHasImage) return 1;
      return 0;
    });

    const productsWithExtras = filteredList.map((product) => {
      const category = categories?.find((c) => c.id === product.category_id);
      const categoryName = category ? category.name : "Uncategorized";

      return {
        id: product.id,
        name: product.name,
        price: product.discounted_price ?? product.original_price ?? "0&nbsp;DT",
        originalPrice: product.original_price ?? null,
        image: product.image_path || null,
        badges: [
          product.new ? "Nouveau" : null,
          product.promo ? "Soldes" : null,
          product.popular ? "Populaire" : null,
        ].filter(Boolean),
        categories: categoryName ? [categoryName] : [],
        brand: product.brand,
        form: product.form,
        tva: product.tva ?? product.discount_percentage,
      };
    });

    // Latest products (new products first, then others by ID descending)
    const newProductsMobile = productsWithExtras.filter((p) => p.badges.includes("Nouveau"));
    const remainingProductsMobile = productsWithExtras.filter((p) => !p.badges.includes("Nouveau"));
    setLatestProducts([...newProductsMobile, ...remainingProductsMobile]);

    // Popular products (popular first, then others)
    const popularProducts = productsWithExtras.filter((p) => p.badges.includes("Populaire"));
    const remainingProducts = productsWithExtras.filter((p) => !p.badges.includes("Populaire"));
    setBestSellingProducts([...popularProducts, ...remainingProducts]);

  } catch (err) {
    console.error("🚨 Unexpected error in fetchHomeData:", err);
  }
};

// ===================== SPECIAL OFFER PRODUCTS =====================
const fetchSpecialOfferProducts = async () => {
  try {
    console.log("Fetching promo products...");
    
    // 1. Fetch active promotions
    const activePromotions = await apiGet("/api/promotions?active=1");

    const activePromoIds = activePromotions?.map((p: any) => p.id) || [];

    // 2. Fetch promo products mappings
    let activeProductIds: any[] = [];
    let promoProducts: any[] = [];
    if (activePromoIds.length > 0) {
      const mappings = await apiGet(`/api/promotion-products?promotionIds=${activePromoIds.join(",")}`);
      promoProducts = mappings || [];
      activeProductIds = promoProducts.map(mp => mp.product_id);
    }

    // 3. Fetch products — no stock filter: admin-curated promo products always show
    if (activeProductIds.length === 0) {
      setSpecialOfferProducts([]);
      return;
    }

    let products: any[] = [];
    try {
      products = await apiGet(`/api/products?ids=${activeProductIds.join(",")}&activeOnly=1`);
    } catch (prodError: any) {
      console.error("❌ Error fetching promo products:", prodError?.message || prodError);
      return;
    }
    console.log("✅ Promo products fetched:", products?.length || 0);

    let categories: any[] = [];
    try {
      categories = await apiGet("/api/categories");
    } catch (catError: any) {
      console.error("❌ Error fetching categories:", catError?.message || catError);
    }

    const productsWithExtras = (products || []).filter(isProductAvailable).map((product) => {
      const category = categories?.find((c) => c.id === product.category_id);
      const categoryName = category ? category.name : "Uncategorized";

      // Match promotion title
      const mapping = promoProducts?.find((mp) => mp.product_id === product.id);
      const promo = mapping ? activePromotions?.find((p: any) => p.id === mapping.promotion_id) : null;
      const promoTitle = promo ? promo.name : null;

      // Dynamic price calculation
      let price = product.discounted_price ?? product.original_price ?? 0;
      if (promo) {
        if (promo.type === 'percentage') {
          price = product.original_price * (1 - promo.value / 100);
        } else {
          price = product.original_price - promo.value;
        }
        if (price < 0) price = 0;
      }

      return {
        id: product.id,
        name: product.name,
        price: price,
        originalPrice: product.original_price ?? null,
        image: product.image_path || null, // 👈 Directly use image_path
        badges: [
          product.popular ? "Populaire" : null,
          "Soldes",
        ].filter(Boolean),
        categories: categoryName ? [categoryName] : [],
        brand: product.brand,
        promoTitle: promoTitle,
        form: product.form,
        tva: product.tva ?? product.discount_percentage,
      };
    });

    productsWithExtras.sort((a, b) => {
      const aHasImage = a.image && a.image !== "";
      const bHasImage = b.image && b.image !== "";
      if (aHasImage && !bHasImage) return -1;
      if (!aHasImage && bHasImage) return 1;
      return 0;
    });

    console.log("✅ Promo products ready:", productsWithExtras);
    setSpecialOfferProducts(productsWithExtras);
  } catch (err) {
    console.error("🚨 Unexpected error in fetchSpecialOfferProducts:", err);
  }
};




  const galleryImages = useGalleryImages();
  const usingFallbackSlides = galleryImages.length === 0;
  const slideCount = usingFallbackSlides ? 1 : galleryImages.length;

  // 👇 Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const data = await apiGet("/api/categories");
        setCategories(data || []);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    };
    fetchCategories();
  }, []);

const addToCart = (product: any, qty: number = 1) => {
  const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
  const exists = savedCart.find((item: any) => item.id === product.id);
  const stockVal = product.form != null && product.form !== "" ? Number(product.form) : null;
  const maxOrderable = stockVal !== null && !isNaN(stockVal) ? stockVal : null;
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
  } else {
    savedCart.push({ ...product, quantity: qty });
    localStorage.setItem("cart", JSON.stringify(savedCart));
    setCart(savedCart);
    showToast("Produit ajouté au panier !");
  }
};

  // 👇 Changer l'image toutes les 5s (seulement quand images chargées)
  useEffect(() => {
    setCurrent(0);
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slideCount);
    }, 5000);
    return () => clearInterval(interval);
  }, [slideCount]);

  if (loading) return <p className="text-center py-10">Chargement...</p>;

  return (
    <div className="bg-gradient-to-b from-[#FFF8F8] via-[#FDF2F4] to-[#FAF0F2] grid justify-items-center [align-items:start] w-screen">
      <div className="bg-transparent overflow-hidden w-full relative">

        <MobileHeader navLinks={navLinks} />

        {/* Hero Image - Carrousel */}
        <div className="relative w-full h-[280px] overflow-hidden group">
          {usingFallbackSlides ? (
            <img
              src="/figmaAssets/brand/banners/cosmetic-2.jpg"
              alt="Glow Store"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            galleryImages.map((src, index) => (
              <img
                key={src}
                src={src}
                alt={`Hero banner ${index + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  opacity: index === current ? 1 : 0,
                  transition: "opacity 0.8s ease-in-out",
                  zIndex: index === current ? 1 : 0,
                }}
              />
            ))
          )}
          {slideCount > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2" style={{ zIndex: 10 }}>
              {Array.from({ length: slideCount }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrent(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === current ? "bg-white scale-125 shadow-sm" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Flèches de navigation */}
          {slideCount > 1 && (
            <>
              <button
                onClick={() => setCurrent((prev) => (prev - 1 + slideCount) % slideCount)}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/30 text-white backdrop-blur-sm border border-white/10 shadow-md active:scale-95 transition-all duration-300 flex items-center justify-center focus:outline-none cursor-pointer"
                aria-label="Slide précédent"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setCurrent((prev) => (prev + 1) % slideCount)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/30 text-white backdrop-blur-sm border border-white/10 shadow-md active:scale-95 transition-all duration-300 flex items-center justify-center focus:outline-none cursor-pointer"
                aria-label="Slide suivant"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Deals Section (Pharmaceutical Theme) */}
        <section id="promotions" className="px-3 py-6 mt-4 relative overflow-hidden bg-gradient-to-br from-[#FFF7ED] via-[#FDF1F0] to-[#FBEAF1] border-y border-[#D88A9E]/15">
          
          {/* Animated Pharmaceutical Background Elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Clinical Dot Grid Pattern */}
            <div 
              className="absolute inset-0" 
              style={{ 
                backgroundImage: 'radial-gradient(#D88A9E 1.5px, transparent 1.5px)', 
                backgroundSize: '30px 30px', 
                opacity: 0.08 
              }} 
            />

            {/* Abstract glowing clinical shapes */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-rose-200/30 rounded-full blur-[50px] animate-[pulse_8s_ease-in-out_infinite]" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-pink-100/40 rounded-full blur-[50px] animate-[pulse_10s_ease-in-out_infinite]" />
          </div>

          <div className="relative z-10">
            <div className="mb-5 flex flex-col items-center text-center">
              <span className="text-[9px] font-bold text-[#C86D85] tracking-[0.2em] uppercase mb-1.5 flex items-center gap-1.5 bg-[#FDF0F3] px-2 py-0.5 rounded-md border border-[#F8D7DF]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#C86D85]" />
                </span>
                OFFRE LIMITÉE
              </span>
              <h2 className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-800 mb-1.5">
                Ventes Flash
              </h2>
              <div className="w-10 h-[3px] bg-gradient-to-r from-[#D88A9E] to-rose-300 rounded-full mb-2" />
            </div>

            {/* Fresh Light Countdown Banner Mobile */}
            <div className="mb-5 mx-1 bg-white rounded-2xl px-4 py-3 shadow-[0_8px_24px_rgba(216,138,158,0.12)] border border-[#F8D7DF]/60 relative overflow-hidden">
              
              {/* Animated glowing top bar */}
              <div className="absolute top-0 left-0 right-0 h-[4px] overflow-hidden rounded-t-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-[#D88A9E] via-rose-300 via-pink-400 to-[#D88A9E] bg-[length:300%_auto] animate-gradient-x" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
              </div>

              {/* Label */}
              <div className="flex items-center gap-2 mb-3 pt-1">
                <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center animate-[pulse_3s_ease-in-out_infinite]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#C86D85]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-0.5">Vente Flash</p>
                  <p className="text-[11px] font-black text-slate-700 uppercase tracking-wide leading-none">Se termine dans</p>
                </div>
              </div>

              {/* Time blocks */}
              <div className="flex items-end gap-1.5">
                {/* Days */}
                <div className="flex flex-col items-center flex-1 group/card">
                  <div className="relative w-full h-14 bg-gradient-to-b from-rose-50/60 to-white rounded-xl flex items-center justify-center border border-rose-100 shadow-[0_4px_10px_rgba(216,138,158,0.1)] overflow-hidden transition-all duration-200 active:scale-95">
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#D88A9E] to-rose-400" />
                    <span className="font-mono font-black text-xl text-[#C86D85] tabular-nums">{String(timeLeft.days).padStart(2, '0')}</span>
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Jours</span>
                </div>
                <div className="flex flex-col gap-1 mb-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D88A9E]/40 animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D88A9E]/40 animate-pulse" />
                </div>
                {/* Hours */}
                <div className="flex flex-col items-center flex-1 group/card">
                  <div className="relative w-full h-14 bg-gradient-to-b from-rose-50/60 to-white rounded-xl flex items-center justify-center border border-rose-100 shadow-[0_4px_10px_rgba(216,138,158,0.1)] overflow-hidden transition-all duration-200 active:scale-95">
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#D88A9E] to-rose-400" />
                    <span className="font-mono font-black text-xl text-[#C86D85] tabular-nums">{String(timeLeft.hours).padStart(2, '0')}</span>
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hrs</span>
                </div>
                <div className="flex flex-col gap-1 mb-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D88A9E]/40 animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D88A9E]/40 animate-pulse" />
                </div>
                {/* Minutes */}
                <div className="flex flex-col items-center flex-1 group/card">
                  <div className="relative w-full h-14 bg-gradient-to-b from-rose-50/60 to-white rounded-xl flex items-center justify-center border border-rose-100 shadow-[0_4px_10px_rgba(216,138,158,0.1)] overflow-hidden transition-all duration-200 active:scale-95">
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#D88A9E] to-rose-400" />
                    <span className="font-mono font-black text-xl text-[#C86D85] tabular-nums">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Min</span>
                </div>
                <div className="flex flex-col gap-1 mb-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400/50 animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400/50 animate-pulse" />
                </div>
                {/* Seconds */}
                <div className="flex flex-col items-center flex-1">
                  <div className="relative w-full h-14 bg-gradient-to-b from-rose-50 to-white rounded-xl flex items-center justify-center border border-rose-200/60 shadow-[0_4px_12px_rgba(244,63,94,0.15)] overflow-hidden">
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-rose-400 to-pink-400" />
                    <span className="font-mono font-black text-xl text-rose-500 tabular-nums">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  </div>
                  <span className="text-[8px] font-bold text-rose-400 uppercase tracking-widest mt-1">Sec</span>
                </div>
              </div>
            </div>



          <div className="grid grid-cols-2 gap-3 pt-1 pb-4">
            {specialOfferProducts.map((product) => {
              const discountPct =
                product.originalPrice && Number(product.originalPrice) > 0
                  ? Math.round(
                      ((Number(product.originalPrice) - Number(product.price)) /
                        Number(product.originalPrice)) * 100
                    )
                  : null;
              return (
                <div key={product.id}>
                  <Link to={`/detailsprod/${product.id}`} className="block group h-full">
                    <Card className="bg-white rounded-xl border border-rose-100/70 hover:border-[#D88A9E] shadow-sm hover:shadow-[0_8px_30px_rgba(216,138,158,0.15)] transition-all h-full active:scale-95 overflow-hidden flex flex-col">
                      
                      {/* Image Zone */}
                      <div className="relative h-36 bg-gradient-to-b from-[#FFF5F6] to-white p-3 flex items-center justify-center overflow-hidden border-b border-rose-100/60">
                        {/* Badges */}
                        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 z-10">
                          {discountPct && discountPct > 0 && (
                            <span className="bg-[#C86D85] text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm tracking-wider uppercase">
                              -{discountPct}%
                            </span>
                          )}
                          {product.badges.some((b: any) => b.toLowerCase().includes('solde')) && (
                            <span className="bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm tracking-wider uppercase">
                              Soldes
                            </span>
                          )}
                        </div>
                        <img
                          className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500 ease-out"
                          alt={product.name}
                          src={convertImageUrl(product.image)}
                          onError={onImgError}
                          loading="lazy"
                          decoding="async"
                        />
                      </div>

                      {/* Content */}
                      <div className="p-2.5 flex flex-col flex-grow">
                        {product.brand && (
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 block truncate">
                            {product.brand}
                          </span>
                        )}

                        {product.promoTitle && (
                          <div className="mb-0.5">
                            <span className="inline-flex items-center px-1 py-0.5 bg-rose-50 text-rose-600 rounded text-[7px] font-bold uppercase tracking-widest border border-rose-100">
                              {product.promoTitle}
                            </span>
                          </div>
                        )}
                        
                        <h3 className="font-semibold text-slate-800 text-[11px] mb-2 line-clamp-2 group-hover:text-[#C86D85] transition-colors" style={{minHeight:'2.6em'}}>
                          {product.name}
                        </h3>
                        
                        <div className="flex items-end justify-between mt-auto pt-2 border-t border-rose-100/50">
                          <div className="flex flex-col">
                            {product.originalPrice && (
                              <span className="font-medium text-slate-400 text-[9px] line-through leading-none mb-0.5">
                                {Number(product.originalPrice).toFixed(3)}&nbsp;DT
                              </span>
                            )}
                            <span className="font-extrabold text-[#C86D85] text-[12px] leading-none whitespace-nowrap">
                              {Number(product.price).toFixed(3)}&nbsp;DT
                            </span>
                          </div>
                          <div className="w-7 h-7 bg-rose-50 text-slate-600 group-hover:bg-[#C86D85] group-hover:text-white rounded-full flex items-center justify-center transition-colors border border-rose-100 group-hover:border-transparent shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                    </Card>
                  </Link>
                </div>
              );
            })}
          </div>
          
          {/* Bottom CTA */}
          <div className="mt-4 flex justify-center pb-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-[#D88A9E] text-[#C86D85] bg-white/80 font-bold text-xs shadow-sm hover:shadow transition-all active:scale-95"
            >
              <span>Découvrir les promotions</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-6 px-3 bg-transparent">
          <div className="max-w-7xl mx-auto">
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide select-none cursor-grab active:cursor-grabbing snap-x snap-mandatory"
              onMouseDown={startDrag}
              onMouseLeave={stopDrag}
              onMouseUp={stopDrag}
              onMouseMove={onDrag}
              onTouchStart={startDrag}
              onTouchEnd={stopDrag}
              onTouchMove={onDrag}
            >
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.id}`}
                  className="flex-shrink-0 text-center cursor-pointer snap-start"
                >
                  <div className="w-[72px] h-[72px] rounded-xl overflow-hidden border border-rose-100/80 bg-white shadow-sm mx-auto flex items-center justify-center">
                    {category.image ? (
                      <img
                        className="w-full h-full object-cover scale-[1.2]"
                        alt={category.name}
                        src={category.image}
                        onError={onImgError}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100">
                        <span className="text-lg font-black text-[#C86D85] uppercase select-none">
                          {category.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2.5 font-semibold text-slate-700 text-[10px] sm:text-xs whitespace-nowrap uppercase tracking-wider">
                    {category.name}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Full-width Cosmetic Advertising Banner Section */}
        <section className="w-full my-4 relative overflow-hidden">
          <Link to="/products" className="block relative h-44 overflow-hidden">
            <img
              src="/figmaAssets/brand/banners/cosmetic-1.jpg"
              alt="Glow Store"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </Link>
        </section>

        {/* Latest Products Section */}
        <section id="derniers-produits" className="px-3 py-6">
          <div className="mb-6">
            <span className="text-[10px] font-bold text-[#C86D85] tracking-widest uppercase mb-1.5 block">SÉLECTION NOUVEAUTÉS</span>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Nos derniers produits
            </h2>
            <div className="w-8 h-[2.5px] bg-[#C86D85] mt-2 rounded-full" />
          </div>

          <div className="relative w-full h-48 mb-6 rounded-2xl overflow-hidden shadow-sm border border-rose-100">
            <img
              src="/figmaAssets/brand/banners/cosmetic-3.jpg"
              alt="Glow Store"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {latestProducts.map((product) => (
              <Link key={product.id} to={`/detailsprod/${product.id}`} className="block group">
                <Card className="bg-white rounded-2xl border border-rose-100/80 hover:border-[#D88A9E]/30 transition-all duration-300 overflow-hidden h-full flex flex-col">
                  <CardContent className="p-2.5 flex flex-col h-full">
                    {/* Badges */}
                    <div className="flex gap-1 mb-1.5 flex-wrap">
                      {product.badges.map((badge: any, index: number) => {
                        const isPromo = badge.toLowerCase().includes("solde") || badge.toLowerCase().includes("promo");
                        return (
                          <Badge
                            key={index}
                            className={`h-4 px-1.5 text-[8px] uppercase font-bold tracking-wider rounded-md border-0 shadow-none ${
                              isPromo ? "bg-rose-50 text-rose-600" : "bg-[#FDF0F3] text-[#C86D85]"
                            }`}
                          >
                            {badge}
                          </Badge>
                        );
                      })}
                    </div>

                    {/* Image */}
                    <div className="w-full h-28 bg-gradient-to-b from-[#FFF5F6] to-white rounded-xl p-2 flex items-center justify-center overflow-hidden mb-2">
                      <img
                        className="max-h-full max-w-full object-contain"
                        alt={product.name}
                        src={convertImageUrl(product.image)}
                        onError={onImgError}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>

                    {/* Brand */}
                    {product.brand && (
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 block">
                        {product.brand}
                      </span>
                    )}

                    {/* Name */}
                    <p className="font-semibold text-slate-700 text-[11px] leading-snug mb-1.5 line-clamp-2">
                      {product.name}
                    </p>

                    {/* Categories */}
                    <div className="flex gap-1 mb-2 flex-wrap">
                      {product.categories.map((category: any, index: number) => (
                        <span
                          key={index}
                          className="px-1.5 py-0.5 bg-[#FDF0F3] text-[#C86D85] border border-[#F8D7DF] rounded-md text-[8px] font-bold uppercase tracking-widest"
                        >
                          {category}
                        </span>
                      ))}
                    </div>

                    {/* Price */}
                    <div className="mt-auto pt-2 border-t border-rose-100/50 flex flex-col">
                      {product.originalPrice &&
                        product.price &&
                        Number(product.price) < Number(product.originalPrice) && (
                          <span className="font-medium text-slate-400 text-[9px] line-through leading-none mb-0.5">
                            {Number(product.originalPrice).toFixed(3)}&nbsp;DT
                          </span>
                        )}
                      <span className="font-extrabold text-[#C86D85] text-sm leading-none whitespace-nowrap mb-2">
                        {Number(
                          product.price && product.price > 0 ? product.price : product.originalPrice
                        ).toFixed(3)}&nbsp;DT
                      </span>
                      <div className="flex items-center justify-between gap-1 mt-auto">
                        <div className="flex items-center bg-rose-50/40 border border-rose-100 rounded-lg p-0.5 shadow-sm" onClick={(e) => e.preventDefault()}>
                          <button
                            onClick={(e) => { e.preventDefault(); changeQty(product.id, -1); }}
                            className="w-4 h-4 rounded-full text-slate-500 hover:text-[#C86D85] hover:bg-white flex items-center justify-center text-[10px] font-bold transition"
                          >−</button>
                          <span className="w-5 text-center text-[9px] font-semibold text-slate-700">{getQty(product.id)}</span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              const stockVal = product.form !== null && product.form !== undefined && product.form !== ""
                                ? Number(product.form) : null;
                              const maxOrderable = stockVal !== null ? stockVal : null;
                              if (maxOrderable !== null && getQty(product.id) + 1 > maxOrderable) {
                                toast.error(`Maximum ${maxOrderable} article${maxOrderable > 1 ? 's' : ''} commandable${maxOrderable > 1 ? 's' : ''} pour ce produit.`, {
                                  style: { borderRadius: "10px", background: "#333", color: "#fff" },
                                });
                                return;
                              }
                              changeQty(product.id, 1);
                            }}
                            className="w-4 h-4 rounded-full text-slate-500 hover:text-[#C86D85] hover:bg-white flex items-center justify-center text-[10px] font-bold transition"
                          >+</button>
                        </div>
                        <button
                          onClick={(e) => { e.preventDefault(); addToCart(product, getQty(product.id)); }}
                          className="relative flex-1 group/btn h-[24px] bg-gradient-to-r from-[#D88A9E] to-[#E8A5B8] hover:from-[#C86D85] hover:to-[#D88A9E] rounded-lg flex items-center justify-center transition-all duration-300 shadow-[0_2px_6px_rgba(216,138,158,0.2)] overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
                          <div className="flex items-center gap-0.5 relative z-10">
                            <ShoppingCartIcon className="w-2.5 h-2.5 text-white" />
                            <span className="text-[8px] font-black text-white uppercase tracking-wider">Ajouter</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Promotional Banner */}
        <div className="px-3 mb-6">
          <div className="relative w-full h-[320px] rounded-2xl overflow-hidden shadow-sm border border-rose-100">
            <img
              src="/figmaAssets/brand/banners/cosmetic-1.jpg"
              alt="Glow Store"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Best Selling / Top Products Section */}
        <section id="meilleurs-produits" className="px-3 py-8 bg-transparent">
          <div className="mb-6">
            <span className="text-[10px] font-bold text-[#C86D85] tracking-widest uppercase mb-1.5 block">SÉLECTION PREMIUM</span>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Meilleurs produits
            </h2>
            <div className="w-8 h-[2.5px] bg-[#C86D85] mt-2 rounded-full" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {bestSellingProducts.map((product) => (
              <Link key={product.id} to={`/detailsprod/${product.id}`} className="block group">
                <Card className="bg-white rounded-2xl border border-rose-100/80 hover:border-[#D88A9E]/30 transition-all duration-300 overflow-hidden h-full flex flex-col">
                  <CardContent className="p-2.5 flex flex-col h-full">
                    {/* Image */}
                    <div className="w-full h-28 bg-gradient-to-b from-[#FFF5F6] to-white rounded-xl p-2 flex items-center justify-center overflow-hidden mb-2">
                      <img
                        className="max-h-full max-w-full object-contain"
                        alt={product.name}
                        src={convertImageUrl(product.image)}
                        onError={onImgError}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>

                    {/* Brand */}
                    {product.brand && (
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 block">
                        {product.brand}
                      </span>
                    )}

                    {/* Name */}
                    <p className="font-semibold text-slate-700 text-[11px] leading-snug mb-1.5 line-clamp-2">
                      {product.name}
                    </p>

                    {/* Categories */}
                    <div className="flex gap-1 mb-2 flex-wrap">
                      {product.categories.map((category: any, index: number) => (
                        <span
                          key={index}
                          className="px-1.5 py-0.5 bg-[#FDF0F3] text-[#C86D85] border border-[#F8D7DF] rounded-md text-[8px] font-bold uppercase tracking-widest"
                        >
                          {category}
                        </span>
                      ))}
                    </div>

                    {/* Price */}
                    <div className="mt-auto pt-2 border-t border-rose-100/50 flex flex-col">
                      {product.originalPrice &&
                        product.price &&
                        Number(product.price) < Number(product.originalPrice) && (
                          <span className="font-medium text-slate-400 text-[9px] line-through leading-none mb-0.5">
                            {Number(product.originalPrice).toFixed(3)}&nbsp;DT
                          </span>
                        )}
                      <span className="font-bold text-[#C86D85] text-sm whitespace-nowrap mb-2">
                        {Number(product.price && product.price > 0 ? product.price : product.originalPrice).toFixed(3)}&nbsp;DT
                      </span>
                      <div className="flex items-center justify-between gap-1 mt-auto">
                        <div className="flex items-center bg-rose-50/40 border border-rose-100 rounded-lg p-0.5 shadow-sm" onClick={(e) => e.preventDefault()}>
                          <button
                            onClick={(e) => { e.preventDefault(); changeQty(product.id, -1); }}
                            className="w-4 h-4 rounded-full text-slate-500 hover:text-[#C86D85] hover:bg-white flex items-center justify-center text-[10px] font-bold transition"
                          >−</button>
                          <span className="w-5 text-center text-[9px] font-semibold text-slate-700">{getQty(product.id)}</span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              const stockVal = product.form !== null && product.form !== undefined && product.form !== ""
                                ? Number(product.form) : null;
                              const maxOrderable = stockVal !== null ? stockVal : null;
                              if (maxOrderable !== null && getQty(product.id) + 1 > maxOrderable) {
                                toast.error(`Maximum ${maxOrderable} article${maxOrderable > 1 ? 's' : ''} commandable${maxOrderable > 1 ? 's' : ''} pour ce produit.`, {
                                  style: { borderRadius: "10px", background: "#333", color: "#fff" },
                                });
                                return;
                              }
                              changeQty(product.id, 1);
                            }}
                            className="w-4 h-4 rounded-full text-slate-500 hover:text-[#C86D85] hover:bg-white flex items-center justify-center text-[10px] font-bold transition"
                          >+</button>
                        </div>
                        <button
                          onClick={(e) => { e.preventDefault(); addToCart(product, getQty(product.id)); }}
                          className="relative flex-1 group/btn h-[24px] bg-gradient-to-r from-[#D88A9E] to-[#E8A5B8] hover:from-[#C86D85] hover:to-[#D88A9E] rounded-lg flex items-center justify-center transition-all duration-300 shadow-[0_2px_6px_rgba(216,138,158,0.2)] overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
                          <div className="flex items-center gap-0.5 relative z-10">
                            <ShoppingCartIcon className="w-2.5 h-2.5 text-white" />
                            <span className="text-[8px] font-black text-white uppercase tracking-wider">Ajouter</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Advertisement Banners */}
        <div className="px-3 space-y-4 mb-6">
          <div
            className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-rose-100 flex flex-col items-center justify-center text-center px-6 py-10"
            style={{ background: "linear-gradient(120deg, #FAD6E3 0%, #E8A5B8 45%, #C86D85 100%)" }}
          >
            <h3 className="font-bold text-white text-lg mb-1.5">
              Nouveautés cosmétiques
            </h3>
            <p className="text-white/90 text-xs">
              Découvrez notre sélection de produits de beauté
            </p>
          </div>
          <div className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-[#F8D7DF]/60 flex flex-col items-center justify-center text-center px-6 py-10 bg-gradient-to-br from-[#FFF7ED] via-[#FDF1F0] to-[#FBEAF1]">
            <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-[#F3D9E4]/60 blur-2xl" />
            <div className="absolute -bottom-10 -right-8 w-28 h-28 rounded-full bg-[#FAD6E3]/60 blur-2xl" />

            <div className="relative w-9 h-9 rounded-full bg-white/90 shadow-sm flex items-center justify-center mb-3 border border-rose-100">
              <Sparkles className="w-4 h-4 text-[#C86D85]" />
            </div>
            <h3 className="relative font-['Playfair_Display',serif] italic text-slate-800 text-lg mb-1.5">
              Une routine beauté sur mesure
            </h3>
            <p className="relative text-slate-500 text-xs">
              Des soins cosmétiques choisis avec soin pour révéler votre éclat naturel
            </p>
          </div>
        </div>

        {/* Services Section */}
        <section className="px-3 py-6 space-y-4 bg-[#FDF5F6]/60 border-t border-rose-100/60">
          {services.map((service, index) => (
            <Link key={index} to={service.link} className="block cursor-pointer">
              <Card
                className="bg-white/90 backdrop-blur-sm rounded-2xl border border-rose-100/80 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${service.bgClass}`}>
                    <service.icon
                      className="w-6 h-6 transition-transform duration-300 group-hover:scale-110 text-[#C86D85]"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm mb-0.5 truncate">
                      {service.title}
                    </h3>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>

        {/* Footer */}
        <FooterMobile />

      </div>
    </div>
  );
};
