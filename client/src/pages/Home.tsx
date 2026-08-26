import React, { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { apiGet, fetchAllProducts } from "@/lib/api";
import Header from "@/components/Header";
import { MobileHeader } from "@/components/MobileHeader";
import Footer from "@/components/Footer";
import { convertImageUrl, onImgError } from "@/lib/imageUtils";
import { ShoppingCartIcon, ChevronLeft, ChevronRight, Zap, Sparkles } from "lucide-react";
import { useCart } from "@/contexts/CartProvider";
import { SERVICE_FEATURES, NAVIGATION_ITEMS, HEADER_LINKS, FOOTER_SECTIONS } from "@/lib/pageData";
import { isProductAvailable, showToast } from "@/lib/productUtils";
import { useActivePromotion } from "@/hooks/useActivePromotion";
import { useGalleryImages } from "@/hooks/useGalleryImages";
import { useProductCategories } from "@/hooks/useProductCategories";
import { useQuantityManager } from "@/hooks/useQuantityManager";

interface Product {
  id: number;
  name: string;
  code?: string;
  category_id?: number;
  description?: string;
  image_path?: string;
  original_price?: number;
  discounted_price?: number;
  discount_percentage?: number;
  is_active?: boolean;
  brand?: string;
  promo?: boolean;
  new?: boolean;
  popular?: boolean;
  categoryName?: string;
  imageUrl?: string;
  price?: number | string;
  originalPrice?: number | string | null;
  image?: string | null;
  badges?: (string | null)[];
  categories?: string[];
  stock_status?: string | null;
  promoTitle?: string | null;
  form?: string | null;
}
interface Conseil {
  id: number;
  title: string;
  date: string;
  image: string;
}





const serviceFeatures = SERVICE_FEATURES;
const navigationItems = NAVIGATION_ITEMS;
const headerLinks = HEADER_LINKS;
const footerSections = FOOTER_SECTIONS;

const ProductCountdown = ({ productId }: { productId: number }) => {
  // Generate a consistent but different initial duration for each product using its ID as a seed
  const initialHours = (productId % 8) + 2; // 2 to 9 hours
  const initialMinutes = (productId * 7) % 60;
  const initialSeconds = (productId * 13) % 60;

  const totalSecondsInitial = initialHours * 3600 + initialMinutes * 60 + initialSeconds;
  const [secondsLeft, setSecondsLeft] = useState(totalSecondsInitial);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : totalSecondsInitial));
    }, 1000);
    return () => clearInterval(timer);
  }, [totalSecondsInitial]);

  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;

  return (
    <div className="flex items-center gap-0.5 bg-white/90 backdrop-blur-sm border border-rose-100 rounded-lg px-1.5 py-1 shadow-sm">
      <span className="text-[8px] font-black text-rose-500 animate-pulse mr-0.5">⏱</span>
      {[
        { val: h, label: "h" },
        { val: m, label: "m" },
        { val: s, label: "s" },
      ].map((t, i) => (
        <span key={i} className="flex items-baseline gap-px">
          <span className="font-mono font-black text-[11px] text-slate-800 tabular-nums">
            {String(t.val).padStart(2, "0")}
          </span>
          <span className="text-[8px] font-bold text-slate-400">{t.label}</span>
          {i < 2 && <span className="text-[9px] font-black text-rose-300 mx-px animate-[pulse_1s_ease-in-out_infinite]">:</span>}
        </span>
      ))}
    </div>
  );
};

export const Home = (): JSX.Element => {

  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  // Home pagination: show 9 product cards per page
  const [homePage, setHomePage] = useState(1);
  const itemsPerPageHome = 9;
  // Best selling pagination
  const [bestPage, setBestPage] = useState(1);
  const itemsPerPageBest = 6;
  const [specialOfferProducts, setSpecialOfferProducts] = useState<Product[]>([]);
  const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([]);

  // Flash sale: individual qty per card + pagination
  const [flashQty, setFlashQty] = useState<Record<number, number>>({});
  const getFlashQty = (id: number) => flashQty[id] ?? 1;
  const changeFlashQty = (id: number, delta: number) =>
    setFlashQty((prev) => ({ ...prev, [id]: Math.max(1, (prev[id] ?? 1) + delta) }));
  const [flashPage, setFlashPage] = useState(1);
  const flashItemsPerPage = 4;

  const [, setblogPosts] = useState<Conseil[]>([]);
  useActivePromotion();

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

  const normalizeHomeProducts = (products: any[], categories: any[] = []) => {
    return (products || [])
      .filter((product) => product && product.is_active !== false && isProductAvailable(product))
      .map((product) => {
        const category = categories?.find((c) => c.id === product.category_id);
        const categoryName = category ? category.name : "";

        return {
          id: product.id,
          name: product.name,
          price: product.discounted_price ?? product.original_price ?? 0,
          originalPrice: product.original_price ?? null,
          image: product.image_path,
          badges: [
            product.new ? "Nouveau" : null,
            product.popular ? "Populaire" : null,
            product.promo ? "Soldes" : null,
          ].filter(Boolean),
          categories: categoryName ? [categoryName] : [],
          brand: product.brand || "",
          form: product.form,
          tva: product.tva ?? product.discount_percentage,
        };
      });
  };

  const getHomeCategories = async () => {
    try {
      const data = await apiGet("/api/categories");
      return data || [];
    } catch {
      return [];
    }
  };

  const fetchHomeData = async () => {
    try {
      let allProducts: any[] = [];

      try {
        const data = await fetchAllProducts("/api/products?activeOnly=1&inStockOnly=1&withPriceOnly=1");
        allProducts = (data || []).filter(isProductAvailable);
      } catch (err: any) {
        console.error("Error fetching products:", err?.message || err);
      }

      const categories = await getHomeCategories();

      const filteredList = allProducts.filter(
        (product) =>
          product &&
          product.is_active !== false &&
          isProductAvailable(product) &&
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

      // Latest products: products marked as new first, then the rest by newest ID
      const newProducts = filteredList.filter((product) => product.new === true);
      const remainingLatestProducts = filteredList.filter((product) => product.new !== true);
      const latestList = [...newProducts, ...remainingLatestProducts];
      setLatestProducts(normalizeHomeProducts(latestList, categories));

      // Popular products: popular first, then others
      const popularProducts = filteredList.filter((product) => product.popular === true);
      const remainingProducts = filteredList.filter((product) => product.popular !== true);
      const bestList = [...popularProducts, ...remainingProducts];
      setBestSellingProducts(normalizeHomeProducts(bestList, categories));

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

      const productsWithExtras = (products || [])
        .map((product) => {
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



  // const images = [
  //   "/figmaAssets/t3.png",
  //   "/figmaAssets/t1.svg",
  //   "/figmaAssets/t4.png"
  // ];
  const galleryImages = useGalleryImages();
  const usingFallbackSlides = galleryImages.length === 0;
  const slideCount = usingFallbackSlides ? 1 : galleryImages.length;

  const { cart, addToCart } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { getQty, changeQty } = useQuantityManager();

  const [current, setCurrent] = useState(0);
  const productCategories = useProductCategories();
  // const [loading, setLoading] = useState(true);

  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [isDraggingCategory, setIsDraggingCategory] = useState(false);
  const [startXCategory, setStartXCategory] = useState(0);
  const [scrollLeftCategory, setScrollLeftCategory] = useState(0);

  const handleMouseDownCategory = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingCategory(true);
    setStartXCategory(e.pageX - (categoryScrollRef.current?.offsetLeft || 0));
    setScrollLeftCategory(categoryScrollRef.current?.scrollLeft || 0);
  };
  const handleMouseLeaveOrUpCategory = () => setIsDraggingCategory(false);
  const handleMouseMoveCategory = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingCategory) return;
    e.preventDefault();
    const x = e.pageX - (categoryScrollRef.current?.offsetLeft || 0);
    const walk = (x - startXCategory) * 1.5;
    if (categoryScrollRef.current) categoryScrollRef.current.scrollLeft = scrollLeftCategory - walk;
  };
  const handleTouchStartCategory = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDraggingCategory(true);
    setStartXCategory(e.touches[0].pageX - (categoryScrollRef.current?.offsetLeft || 0));
    setScrollLeftCategory(categoryScrollRef.current?.scrollLeft || 0);
  };
  const handleTouchMoveCategory = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingCategory) return;
    const x = e.touches[0].pageX - (categoryScrollRef.current?.offsetLeft || 0);
    const walk = (x - startXCategory) * 1.5;
    if (categoryScrollRef.current) categoryScrollRef.current.scrollLeft = scrollLeftCategory - walk;
  };

  // Auto-scroll categories from right to left (pause on hover or drag)
  const [isAutoScrollingPaused, setIsAutoScrollingPaused] = useState(false);

  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el) return;

    let rafId = 0 as number;
    let lastTime = performance.now();

    const speedPxPerSec = 100; // pixels per second

    const step = (time: number) => {
      const dt = Math.min(100, time - lastTime) / 1000; // seconds
      lastTime = time;
      if (!isAutoScrollingPaused && !isDraggingCategory) {
        const delta = speedPxPerSec * dt;
        el.scrollLeft = Math.min(el.scrollLeft + delta, el.scrollWidth - el.clientWidth);
        // loop back to start when reached end
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) {
          el.scrollLeft = 0;
        }
      }
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isAutoScrollingPaused, isDraggingCategory, productCategories]);

  const handleAddToCart = (product: any, qty: number = 1) => {
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

    const rawPrice = typeof product.price === 'string' && product.price.includes('&nbsp;')
      ? parseFloat(product.price.replace('&nbsp;DT', ''))
      : product.price;

    const priceVal = (rawPrice !== undefined && rawPrice !== null && !isNaN(Number(rawPrice)))
      ? Number(rawPrice)
      : Number(product.originalPrice || 0);

    addToCart({
      ...product,
      id: String(product.id),
      discounted_price: priceVal,
      original_price: Number(product.originalPrice !== null && product.originalPrice !== undefined ? product.originalPrice : priceVal),
      quantity: qty
    });
    showToast('Produit ajouté au panier !');
  };
  // 👇 Changer l'image toutes les 5s (seulement quand les images sont chargées)
  useEffect(() => {
    setCurrent(0); // reset au début quand les slides changent
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slideCount);
    }, 5000);
    return () => clearInterval(interval);
  }, [slideCount]);

  return (
    <div className="bg-gradient-to-b from-[#FFF8F8] via-[#FDF2F4] to-[#FAF0F2] min-h-screen w-full">
      {/* Header — desktop / mobile adaptatif */}
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

      {/* Hero banner */}
      <section className="py-1 bg-transparent">
        <div className="w-full">
          <div className="relative w-full h-48 sm:h-64 lg:h-80 overflow-hidden shadow-sm group">
            {usingFallbackSlides ? (
              <img
                src="/figmaAssets/brand/banners/cosmetic-10.jpg"
                alt="Cosmétiques"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <>
                {galleryImages.map((src, index) => (
                  <img
                    key={src}
                    src={src}
                    alt={`Hero banner ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-700 ease-in-out"
                    style={{
                      opacity: index === current ? 1 : 0,
                      transition: "opacity 0.8s ease-in-out",
                      zIndex: index === current ? 1 : 0,
                    }}
                  />
                ))}
              </>
            )}

            {/* Points de navigation */}
            {slideCount > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2" style={{ zIndex: 10 }}>
                {Array.from({ length: slideCount }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrent(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === current ? "bg-white scale-125 shadow-sm" : "bg-white/40 hover:bg-white/60"
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/25 hover:bg-black/45 text-white backdrop-blur-sm border border-white/10 shadow-md hover:shadow-lg active:scale-95 hover:scale-105 opacity-100 transition-opacity duration-300 flex items-center justify-center focus:outline-none cursor-pointer"
                  aria-label="Slide précédent"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setCurrent((prev) => (prev + 1) % slideCount)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/25 hover:bg-black/45 text-white backdrop-blur-sm border border-white/10 shadow-md hover:shadow-lg active:scale-95 hover:scale-105 opacity-100 transition-opacity duration-300 flex items-center justify-center focus:outline-none cursor-pointer"
                  aria-label="Slide suivant"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      </section>


      {/* ⚡ Ventes Flash — Feminine Soft Blush Design */}
      <section id="promotions" className="py-6 bg-gradient-to-br from-[#FFF7ED] via-[#FDF1F0] to-[#FBEAF1] border-y border-[#D88A9E]/15 relative overflow-hidden group/section">

        {/* Abstract Glowing Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[60%] bg-gradient-to-br from-rose-300/25 to-pink-200/15 rounded-full blur-[100px] animate-[pulse_6s_ease-in-out_infinite]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[50%] bg-gradient-to-tl from-rose-200/20 to-pink-300/15 rounded-full blur-[80px] animate-[pulse_8s_ease-in-out_infinite_reverse]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* ✨ High-Impact Header Bar ✨ */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-3">

            {/* Left: Title Area */}
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-br from-white to-rose-50 rounded-2xl shadow-[0_8px_16px_rgba(216,138,158,0.15)] border border-white">
                <span className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#D88A9E]/20 to-transparent opacity-50"></span>
                <Zap className="w-5 h-5 text-[#C86D85] fill-[#C86D85]/10 animate-bounce" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C86D85]" />
                  </span>
                  <span className="text-[9px] font-black text-[#C86D85] tracking-[0.3em] uppercase bg-[#FDF0F3] px-2 py-0.5 rounded-md border border-[#F8D7DF]">
                    Offre Limitée
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-rose-900 to-[#C86D85] tracking-tight">
                  Ventes Flash
                </h2>
              </div>
            </div>

            {/* Right: Stunning Glassmorphism Countdown - Now fully animated! (Commented out as each card has its own timer now) */}
            {/* 
            <div className="flex items-center gap-4 bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2.5rem] p-2.5 shadow-[0_10px_30px_rgba(216,138,158,0.08)] hover:shadow-[0_15px_40px_rgba(216,138,158,0.2)] transition-all duration-500 hover:scale-[1.02] cursor-default group/timer">

              <div className="relative overflow-hidden bg-gradient-to-r from-[#C86D85] to-[#E8A5B8] rounded-[2rem] px-6 py-3.5 flex items-center gap-2.5 shadow-inner transition-transform duration-500 group-hover/timer:shadow-[0_0_20px_rgba(216,138,158,0.4)]">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover/timer:animate-[pulse_1s_ease-in-out_infinite] skew-x-12 transition-all duration-700" />

                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/90 animate-pulse relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-black text-white uppercase tracking-widest hidden sm:block relative z-10">
                  Expire dans
                </span>
              </div>

              <div className="flex items-center gap-1.5 pr-4">
                {[
                  { val: timeLeft.days, label: "Jrs", primary: false },
                  { val: timeLeft.hours, label: "Hrs", primary: false },
                  { val: timeLeft.minutes, label: "Min", primary: false },
                  { val: timeLeft.seconds, label: "Sec", primary: true },
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className={`flex flex-col items-center justify-center min-w-[48px] h-[48px] rounded-2xl border ${t.primary ? 'bg-rose-50 border-rose-100 shadow-[0_4px_12px_rgba(244,63,94,0.15)] animate-pulse' : 'bg-white border-slate-100 shadow-sm'} transform transition-all duration-300 hover:-translate-y-1.5 hover:scale-110 hover:shadow-md`}>
                      <span className={`font-mono font-black text-lg leading-none tabular-nums ${t.primary ? 'text-rose-600' : 'text-slate-800'}`}>
                        {String(t.val).padStart(2, "0")}
                      </span>
                      <span className={`text-[9px] font-black uppercase tracking-widest mt-1 ${t.primary ? 'text-rose-400' : 'text-slate-400'}`}>
                        {t.label}
                      </span>
                    </div>
                    {i < 3 && <span className="text-slate-300 font-black text-xl animate-[pulse_1s_ease-in-out_infinite]">:</span>}
                  </div>
                ))}
              </div>
            </div>
            */}
          </div>

          {/* 🎁 Ultra-Premium Product Grid — with individual counters + navigation arrows */}
          <div className="relative z-10">
            {/* Navigation arrows + page indicator */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-500 font-semibold">
                {specialOfferProducts.length} produit{specialOfferProducts.length > 1 ? 's' : ''} en promotion
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFlashPage(p => Math.max(1, p - 1))}
                  disabled={flashPage === 1}
                  className="w-9 h-9 rounded-full bg-white border border-rose-100 shadow-sm hover:shadow-md hover:border-[#D88A9E]/40 hover:text-[#C86D85] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                  aria-label="Produits précédents"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-600 px-1">
                  {flashPage} / {Math.max(1, Math.ceil(specialOfferProducts.length / flashItemsPerPage))}
                </span>
                <button
                  onClick={() => setFlashPage(p => Math.min(Math.ceil(specialOfferProducts.length / flashItemsPerPage), p + 1))}
                  disabled={flashPage >= Math.ceil(specialOfferProducts.length / flashItemsPerPage)}
                  className="w-9 h-9 rounded-full bg-white border border-rose-100 shadow-sm hover:shadow-md hover:border-[#D88A9E]/40 hover:text-[#C86D85] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                  aria-label="Produits suivants"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
              {specialOfferProducts
                .slice((flashPage - 1) * flashItemsPerPage, flashPage * flashItemsPerPage)
                .map((product, idx) => {
                  const discountPct =
                    product.originalPrice && Number(product.originalPrice) > 0
                      ? Math.round(
                        ((Number(product.originalPrice) - Number(product.price)) /
                          Number(product.originalPrice)) * 100
                      )
                      : null;

                  return (
                    <div
                      key={product.id}
                      className="group relative bg-white rounded-3xl border border-rose-100/70 hover:border-[#D88A9E]/40 shadow-[0_4px_20px_rgba(216,138,158,0.06)] hover:shadow-[0_20px_40px_-10px_rgba(216,138,158,0.2)] transition-all duration-500 overflow-hidden flex flex-col hover:-translate-y-1"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      {/* Highlight Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-b from-[#D88A9E]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                      {/* Discount Badge */}
                      {discountPct !== null && discountPct > 0 && (
                        <div className="absolute top-3 left-3 z-20">
                          <div className="relative group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                            <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-rose-600 blur-md opacity-40 rounded-xl" />
                            <div className="relative bg-gradient-to-br from-rose-500 to-rose-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm border border-white/20 flex items-center gap-0.5">
                              <span className="text-[9px]">−</span>{discountPct}%
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ⏱ Mini countdown timer — independent per card */}
                      <div className="absolute top-3 right-3 z-20">
                        <ProductCountdown productId={product.id} />
                      </div>

                      {/* Image */}
                      <Link to={`/detailsprod/${product.id}`} className="relative block p-2 sm:p-4 bg-gradient-to-b from-[#FFF5F6] to-white group-hover:bg-[#FDF0F3]/60 transition-colors duration-500 flex items-center justify-center h-32 sm:h-44 overflow-hidden rounded-t-3xl">
                        <div className="absolute inset-0 bg-white mix-blend-overlay opacity-50" />
                        <img
                          className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-700 ease-out mix-blend-multiply relative z-10 drop-shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                          alt={product.name}
                          src={convertImageUrl(product.image || undefined)}
                          onError={onImgError}
                          loading="lazy"
                          decoding="async"
                        />
                      </Link>

                      {/* Info */}
                      <div className="p-2 sm:p-4 flex flex-col flex-1 relative bg-white z-20 rounded-b-3xl">
                        <div className="flex items-center justify-between mb-1">
                          {product.brand && (
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">{product.brand}</span>
                          )}
                          {(product.categories || [])[0] && (
                            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 bg-[#FDF0F3] text-[#C86D85] rounded text-[8px] font-bold uppercase tracking-widest border border-[#F8D7DF]">
                              {(product.categories || [])[0]}
                            </span>
                          )}
                        </div>

                        {product.promoTitle && (
                          <div className="mb-1">
                            <span className="inline-flex items-center px-1 py-0.5 bg-rose-50 text-rose-600 rounded text-[7px] font-bold uppercase tracking-widest border border-rose-100">
                              {product.promoTitle}
                            </span>
                          </div>
                        )}

                        <Link to={`/detailsprod/${product.id}`} className="block mb-2">
                          <h3 className="font-bold text-slate-800 text-[11px] sm:text-sm leading-tight line-clamp-2 group-hover:text-[#C86D85] transition-colors" style={{minHeight:'2.4em'}}>
                            {product.name}
                          </h3>
                        </Link>

                        {/* Price + individual counter + cart */}
                        <div className="mt-auto flex flex-col gap-2">
                          <div className="flex items-end gap-1 bg-rose-50/40 p-1.5 sm:p-2 rounded-lg border border-rose-100/50">
                            <span className="font-black text-sm sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-[#C86D85] to-[#E07A95] leading-none">
                              {Number(product.price).toFixed(3)}
                              <span className="text-[9px] font-bold text-[#C86D85] ml-0.5">&nbsp;DT</span>
                            </span>
                            {product.originalPrice && (
                              <span className="text-[9px] font-bold text-slate-400 line-through decoration-rose-300/50 mb-0.5">
                                {Number(product.originalPrice).toFixed(3)}&nbsp;DT
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Individual QTY counter per card */}
                            <div className="flex items-center justify-between bg-white rounded-lg border border-rose-100 p-0.5 shadow-sm w-16 sm:w-20">
                              <button
                                onClick={(e) => { e.preventDefault(); changeFlashQty(product.id, -1); }}
                                className="w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center text-slate-500 font-bold hover:bg-rose-50 hover:text-[#C86D85] transition-colors text-xs"
                              >−</button>
                              <span className="text-[9px] font-black text-slate-700">{getFlashQty(product.id)}</span>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  const stockVal = product.form !== null && product.form !== undefined && product.form !== ""
                                    ? Number(product.form) : null;
                                  const maxOrderable = stockVal !== null ? stockVal : null;
                                  if (maxOrderable !== null && getFlashQty(product.id) + 1 > maxOrderable) {
                                    toast.error(`Maximum ${maxOrderable} article${maxOrderable > 1 ? 's' : ''} commandable${maxOrderable > 1 ? 's' : ''} pour ce produit.`, {
                                      style: { borderRadius: "10px", background: "#333", color: "#fff" },
                                    });
                                    return;
                                  }
                                  changeFlashQty(product.id, 1);
                                }}
                                className="w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center text-slate-500 font-bold hover:bg-rose-50 hover:text-[#C86D85] transition-colors text-xs"
                              >+</button>
                            </div>

                            {/* Add to Cart */}
                            <button
                              onClick={(e) => { e.preventDefault(); handleAddToCart(product, getFlashQty(product.id)); }}
                              className="relative flex-1 group/btn h-[28px] sm:h-[32px] bg-gradient-to-r from-[#D88A9E] to-[#E8A5B8] hover:from-[#C86D85] hover:to-[#D88A9E] rounded-lg flex items-center justify-center transition-all duration-300 shadow-[0_4px_10px_rgba(216,138,158,0.25)] hover:shadow-[0_6px_15px_rgba(216,138,158,0.35)] hover:-translate-y-0.5 overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
                              <div className="flex items-center gap-1 relative z-10">
                                <ShoppingCartIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                                <span className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-wider">Ajouter</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

        </div>
      </section>

      {/* Product categories */}
      <section className="py-14 bg-transparent relative group">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Left Arrow Button */}
          <button
            onClick={() => {
              categoryScrollRef.current?.scrollBy({ left: -300, behavior: "smooth" });
            }}
            onMouseEnter={() => setIsAutoScrollingPaused(true)}
            onMouseLeave={() => setIsAutoScrollingPaused(false)}
            className="absolute left-0 md:-left-12 top-[30%] sm:top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-11 md:h-11 rounded-full bg-white border border-rose-100 shadow-md hover:shadow-lg active:scale-95 hover:scale-105 transition-all duration-300 flex items-center justify-center text-slate-600 hover:text-[#C86D85] focus:outline-none cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Right Arrow Button */}
          <button
            onClick={() => {
              categoryScrollRef.current?.scrollBy({ left: 300, behavior: "smooth" });
            }}
            onMouseEnter={() => setIsAutoScrollingPaused(true)}
            onMouseLeave={() => setIsAutoScrollingPaused(false)}
            className="absolute right-0 md:-right-12 top-[30%] sm:top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-11 md:h-11 rounded-full bg-white border border-rose-100 shadow-md hover:shadow-lg active:scale-95 hover:scale-105 transition-all duration-300 flex items-center justify-center text-slate-600 hover:text-[#C86D85] focus:outline-none cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          <div
            ref={categoryScrollRef}
            className="flex space-x-6 lg:space-x-12 overflow-x-auto pb-4 scrollbar-hide cursor-grab active:cursor-grabbing px-10 md:px-0"
            onMouseDown={handleMouseDownCategory}
            onMouseEnter={() => setIsAutoScrollingPaused(true)}
            onMouseLeave={() => { setIsAutoScrollingPaused(false); handleMouseLeaveOrUpCategory(); }}
            onMouseUp={handleMouseLeaveOrUpCategory}
            onMouseMove={handleMouseMoveCategory}
            onTouchStart={handleTouchStartCategory}
            onTouchEnd={handleMouseLeaveOrUpCategory}
            onTouchMove={handleTouchMoveCategory}
          >
            {productCategories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="flex-shrink-0 text-center cursor-pointer group/item"
              >
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 mx-auto transition-all duration-400 ease-[cubic-bezier(0.25,0.8,0.25,1)] filter drop-shadow-sm hover:drop-shadow-md hover:scale-105">
                  <div className="w-full h-full clip-octagon overflow-hidden bg-white border border-rose-100/60">
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
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100">
                        <span className="text-2xl sm:text-3xl font-black text-[#C86D85] uppercase select-none">
                          {category.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 font-semibold text-slate-700 text-[10px] sm:text-xs lg:text-sm uppercase tracking-wider group-hover/item:text-[#C86D85] transition-colors max-w-[100px] sm:max-w-[140px] mx-auto leading-tight">
                  {category.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest products */}
      <section id="derniers-produits" className="py-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col items-center text-center">
            <span className="text-[11px] font-bold text-[#C86D85] tracking-[0.2em] uppercase mb-3 animate-pulse">
              SÉLECTION NOUVEAUTÉS
            </span>
            <div className="flex items-center justify-center w-full gap-4 sm:gap-8 group">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-[#D88A9E]/50 to-[#D88A9E] flex-1 rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-700"></div>
              <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight uppercase whitespace-nowrap text-slate-800 hover:scale-105 transition-transform duration-500">
                Nos derniers produits
              </h2>
              <div className="h-[2px] bg-gradient-to-l from-transparent via-[#D88A9E]/50 to-[#D88A9E] flex-1 rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-700"></div>
            </div>
          </div>

          {/* Horizontal Banner Slider */}
          <div className="relative w-full h-48 sm:h-64 lg:h-80 mb-10 rounded-2xl overflow-hidden shadow-sm border border-rose-100 group">
            <img
              src="/figmaAssets/brand/banners/cosmetic-6.jpg"
              alt="Glow Store"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Products grid */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <div />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHomePage((p) => Math.max(1, p - 1))}
                    className="w-10 h-10 rounded-full bg-white border border-rose-100 shadow-md hover:shadow-lg transition flex items-center justify-center hover:text-[#C86D85]"
                    aria-label="Précédent"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <span className="text-sm text-slate-600">{homePage} / {Math.max(1, Math.ceil(latestProducts.length / itemsPerPageHome))}</span>
                  <button
                    onClick={() => setHomePage((p) => Math.min(Math.max(1, Math.ceil(latestProducts.length / itemsPerPageHome)), p + 1))}
                    className="w-10 h-10 rounded-full bg-white border border-rose-100 shadow-md hover:shadow-lg transition flex items-center justify-center hover:text-[#C86D85]"
                    aria-label="Suivant"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {(() => {
                  const items = latestProducts.slice((homePage - 1) * itemsPerPageHome, homePage * itemsPerPageHome);
                  return items.map((product, index) => {
                    const isLastAndOdd = index === items.length - 1 && items.length % 2 !== 0;
                    return (
                      <div
                        key={product.id}
                        className={`block h-full group ${
                          isLastAndOdd
                            ? "col-span-2 justify-self-center w-full max-w-[calc(50%-0.375rem)] sm:col-span-1 sm:max-w-none"
                            : ""
                        }`}
                      >
                    <Card className="bg-white rounded-2xl border border-rose-100/70 hover:border-[#D88A9E]/30 hover:shadow-[0_10px_30px_rgba(216,138,158,0.15)] transition-all duration-400 ease-[cubic-bezier(0.25,0.8,0.25,1)] h-full flex flex-col overflow-hidden">
                      <CardContent className="p-2.5 sm:p-4 flex flex-col h-full">
                        {/* Badges */}
                        <div className="flex gap-1 mb-2 flex-wrap">
                          {(product.badges || []).map((badge, badgeIndex) => {
                            const isPromo = (badge?.toLowerCase() || "").includes("solde") || (badge?.toLowerCase() || "").includes("promo");
                            return (
                              <Badge
                                key={badgeIndex}
                                className={`h-5 px-1.5 text-[8px] sm:h-5.5 sm:px-2 sm:text-[9px] uppercase font-bold tracking-wider rounded-md border-0 shadow-none ${isPromo
                                  ? "bg-rose-50 text-rose-600 font-bold"
                                  : "bg-[#FDF0F3] text-[#C86D85]"
                                  }`}
                              >
                                {badge}
                              </Badge>
                            );
                          })}
                        </div>

                        {/* Image */}
                        <Link to={`/detailsprod/${product.id}`} className="relative mb-2 flex-shrink-0 bg-gradient-to-b from-[#FFF5F6] to-white rounded-xl p-2 sm:p-4 flex items-center justify-center h-32 sm:h-44 overflow-hidden block">
                          <img
                            className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]"
                            alt={product.name}
                            src={convertImageUrl(product.image || undefined)}
                            onError={onImgError}
                            loading="lazy"
                            decoding="async"
                          />
                        </Link>

                        {/* Brand */}
                        {product.brand && (
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                            {product.brand}
                          </span>
                        )}

                        {/* Name */}
                        <Link to={`/detailsprod/${product.id}`} className="block">
                          <h3 className="font-semibold text-slate-700 text-xs sm:text-sm mb-2 line-clamp-2 hover:text-[#C86D85] transition-colors h-8 sm:h-10">
                            {product.name}
                          </h3>
                        </Link>

                        {/* Categories */}
                        <div className="flex gap-1 mb-3 flex-wrap">
                          {(product.categories || []).map((category, catIndex) => (
                            <span
                              key={catIndex}
                              className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-0.5 bg-[#FDF0F3] text-[#C86D85] rounded-md text-[8px] sm:text-[9px] font-bold uppercase tracking-widest border border-[#F8D7DF] shadow-sm"
                            >
                              {category}
                            </span>
                          ))}
                        </div>

                        {/* Price + Quantity + Button */}
                        <div className="mt-auto pt-3 border-t border-rose-100/60 flex flex-col gap-2">
                          <div className="flex flex-col">
                            {product.originalPrice &&
                              product.price &&
                              Number(product.price) < Number(product.originalPrice) && (
                                <span className="font-medium text-slate-400 text-[9px] sm:text-xs line-through leading-none mb-1">
                                  {Number(product.originalPrice).toFixed(3)}&nbsp;DT
                                </span>
                              )}
                            <span className="font-extrabold text-[#C86D85] text-sm sm:text-base leading-none whitespace-nowrap">
                              {Number(
                                product.price && Number(product.price) > 0
                                  ? product.price
                                  : product.originalPrice
                              ).toFixed(3)}{" "}
                              DT
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center bg-rose-50/40 border border-rose-100 rounded-lg p-0.5 shadow-sm">
                              <button
                                onClick={(e) => { e.preventDefault(); changeQty(product.id, -1); }}
                                className="w-5 h-5 rounded-full text-slate-500 hover:text-[#C86D85] hover:bg-white flex items-center justify-center text-xs font-bold transition"
                              >−</button>
                              <span className="w-6 text-center text-[10px] sm:text-xs font-semibold text-slate-700">{getQty(product.id)}</span>
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
                                className="w-5 h-5 rounded-full text-slate-500 hover:text-[#C86D85] hover:bg-white flex items-center justify-center text-xs font-bold transition"
                              >+</button>
                            </div>
                            <button
                              onClick={(e) => { e.preventDefault(); handleAddToCart(product, getQty(product.id)); }}
                              className="relative flex-1 group/btn h-[28px] sm:h-[32px] bg-gradient-to-r from-[#D88A9E] to-[#E8A5B8] hover:from-[#C86D85] hover:to-[#D88A9E] rounded-lg flex items-center justify-center transition-all duration-300 shadow-[0_4px_10px_rgba(216,138,158,0.25)] hover:shadow-[0_6px_15px_rgba(216,138,158,0.35)] hover:-translate-y-0.5 overflow-hidden"
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
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6">
        <div className="h-[1px] bg-rose-100/60 relative">
          <div className="absolute top-0 left-0 w-16 h-[2px] bg-[#C86D85]" />
        </div>
      </div>

      {/* Best selling products section */}
      <section id="meilleurs-produits" className="py-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col items-center text-center">
            <span className="text-[11px] font-bold text-[#C86D85] tracking-[0.2em] uppercase mb-3 animate-pulse">
              SÉLECTION PREMIUM
            </span>
            <div className="flex items-center justify-center w-full gap-4 sm:gap-8 group">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-[#D88A9E]/50 to-[#D88A9E] flex-1 rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-700"></div>
              <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight uppercase whitespace-nowrap text-slate-800 hover:scale-105 transition-transform duration-500">
                Meilleurs produits
              </h2>
              <div className="h-[2px] bg-gradient-to-l from-transparent via-[#D88A9E]/50 to-[#D88A9E] flex-1 rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-700"></div>
            </div>
          </div>

          {/* Horizontal Banner Slider */}
          <div className="relative w-full h-48 sm:h-64 lg:h-80 mb-10 rounded-2xl overflow-hidden shadow-sm border border-rose-100 group">
            <img
              src="/figmaAssets/brand/banners/cosmetic-1.jpg"
              alt="Glow Store"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <div />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBestPage((p) => Math.max(1, p - 1))}
                    className="w-10 h-10 rounded-full bg-white border border-rose-100 shadow-md hover:shadow-lg transition flex items-center justify-center hover:text-[#C86D85]"
                    aria-label="Précédent"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <span className="text-sm text-slate-600">{bestPage} / {Math.max(1, Math.ceil(bestSellingProducts.length / itemsPerPageBest))}</span>
                  <button
                    onClick={() => setBestPage((p) => Math.min(Math.max(1, Math.ceil(bestSellingProducts.length / itemsPerPageBest)), p + 1))}
                    className="w-10 h-10 rounded-full bg-white border border-rose-100 shadow-md hover:shadow-lg transition flex items-center justify-center hover:text-[#C86D85]"
                    aria-label="Suivant"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {(() => {
                  const items = bestSellingProducts.slice((bestPage - 1) * itemsPerPageBest, bestPage * itemsPerPageBest);
                  return items.map((product, index) => {
                    const isLastAndOdd = index === items.length - 1 && items.length % 2 !== 0;
                    return (
                      <div
                        key={product.id}
                        className={`block h-full group ${
                          isLastAndOdd
                            ? "col-span-2 justify-self-center w-full max-w-[calc(50%-0.375rem)] sm:col-span-1 sm:max-w-none"
                            : ""
                        }`}
                      >
                    <Card className="bg-white rounded-2xl border border-rose-100/70 hover:border-[#D88A9E]/30 hover:shadow-[0_10px_30px_rgba(216,138,158,0.15)] transition-all duration-400 ease-[cubic-bezier(0.25,0.8,0.25,1)] h-full flex flex-col overflow-hidden">
                      <CardContent className="p-2.5 sm:p-4 flex flex-col h-full">
                        <div className="flex gap-1 mb-2 flex-wrap">
                          {(product.badges || []).map((badge, badgeIndex) => {
                            const isPromo = (badge?.toLowerCase() || "").includes("solde") || (badge?.toLowerCase() || "").includes("promo");
                            return (
                              <Badge
                                key={badgeIndex}
                                className={`h-5 px-1.5 text-[8px] sm:h-5.5 sm:px-2 sm:text-[9px] uppercase font-bold tracking-wider rounded-md border-0 shadow-none ${isPromo
                                  ? "bg-rose-50 text-rose-600 font-bold"
                                  : "bg-[#FDF0F3] text-[#C86D85]"
                                  }`}
                              >
                                {badge}
                              </Badge>
                            );
                          })}
                        </div>

                        {/* Image */}
                        <Link to={`/detailsprod/${product.id}`} className="relative mb-2 flex-shrink-0 bg-gradient-to-b from-[#FFF5F6] to-white rounded-xl p-2 sm:p-4 flex items-center justify-center h-32 sm:h-44 overflow-hidden block">
                          <img
                            className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]"
                            alt={product.name}
                            src={convertImageUrl(product.image || undefined)}
                            onError={onImgError}
                            loading="lazy"
                            decoding="async"
                          />
                        </Link>

                        {/* Brand */}
                        {product.brand && (
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                            {product.brand}
                          </span>
                        )}

                        {/* Name */}
                        <Link to={`/detailsprod/${product.id}`} className="block">
                          <h3 className="font-semibold text-slate-700 text-xs sm:text-sm mb-2 line-clamp-2 hover:text-[#C86D85] transition-colors h-8 sm:h-10">
                            {product.name}
                          </h3>
                        </Link>

                        <div className="flex gap-1 mb-3 flex-wrap">
                          {(product.categories || []).map((category, catIndex) => (
                            <span
                              key={catIndex}
                              className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-0.5 bg-[#FDF0F3] text-[#C86D85] rounded-md text-[8px] sm:text-[9px] font-bold uppercase tracking-widest border border-[#F8D7DF] shadow-sm"
                            >
                              {category}
                            </span>
                          ))}
                        </div>

                        <div className="mt-auto pt-3 border-t border-rose-100/60 flex flex-col gap-2">
                          <div className="flex flex-col">
                            {product.originalPrice &&
                              product.price &&
                              Number(product.price) < Number(product.originalPrice) && (
                                <span className="font-medium text-slate-400 text-[9px] sm:text-xs line-through leading-none mb-1">
                                  {Number(product.originalPrice).toFixed(3)}&nbsp;DT
                                </span>
                              )}
                            <span className="font-extrabold text-[#C86D85] text-sm sm:text-base leading-none whitespace-nowrap">
                              {Number(
                                product.price && Number(product.price) > 0
                                  ? product.price
                                  : product.originalPrice
                              ).toFixed(3)}{' '}
                              DT
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center bg-rose-50/40 border border-rose-100 rounded-lg p-0.5 shadow-sm">
                              <button
                                onClick={(e) => { e.preventDefault(); changeQty(product.id, -1); }}
                                className="w-5 h-5 rounded-full text-slate-500 hover:text-[#C86D85] hover:bg-white flex items-center justify-center text-xs font-bold transition"
                              >−</button>
                              <span className="w-6 text-center text-[10px] sm:text-xs font-semibold text-slate-700">{getQty(product.id)}</span>
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
                                className="w-5 h-5 rounded-full text-slate-500 hover:text-[#C86D85] hover:bg-white flex items-center justify-center text-xs font-bold transition"
                              >+</button>
                            </div>
                            <button
                              onClick={(e) => { e.preventDefault(); handleAddToCart(product, getQty(product.id)); }}
                              className="relative flex-1 group/btn h-[28px] sm:h-[32px] bg-gradient-to-r from-[#D88A9E] to-[#E8A5B8] hover:from-[#C86D85] hover:to-[#D88A9E] rounded-lg flex items-center justify-center transition-all duration-300 shadow-[0_4px_10px_rgba(216,138,158,0.25)] hover:shadow-[0_6px_15px_rgba(216,138,158,0.35)] hover:-translate-y-0.5 overflow-hidden"
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
                      </div>
                    );
                  });
                })()}
              </div>
            </div>


          </div>
        </div>
      </section>

      {/* Large promotional banner */}
      <section className="py-8 w-full bg-gradient-to-b from-[#FFF5F6] to-transparent">
        <div className="relative w-full flex flex-col items-center justify-center text-center px-6 py-16 md:py-24 overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFF7ED] via-[#FDF1F0] to-[#FBEAF1] shadow-[0_15px_35px_rgba(216,138,158,0.12)] border border-[#F8D7DF]/60">
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-[#F3D9E4]/60 blur-3xl" />
          <div className="absolute -bottom-16 -right-10 w-56 h-56 rounded-full bg-[#FAD6E3]/60 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full bg-white/40 blur-3xl" />

          <div className="relative w-11 h-11 rounded-full bg-white/90 shadow-sm flex items-center justify-center mb-5 border border-rose-100">
            <Sparkles className="w-5 h-5 text-[#C86D85]" />
          </div>

          <div className="relative flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-[#D88A9E]/50" />
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#C86D85] font-semibold">Glow Store</span>
            <span className="w-8 h-px bg-[#D88A9E]/50" />
          </div>

          <h2 className="relative font-['Playfair_Display',serif] italic text-slate-800 text-2xl md:text-4xl mb-4">
            Une routine beauté sur mesure
          </h2>
          <p className="relative text-slate-500 text-sm md:text-base max-w-md">
            Des soins cosmétiques choisis avec soin pour révéler votre éclat naturel.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6">
        <div className="h-[1px] bg-rose-100/60 relative">
          <div className="absolute top-0 left-0 w-16 h-[2px] bg-[#C86D85]" />
        </div>
      </div>

      {/* Service features */}
      <section className="py-20 bg-[#FDF5F6]/60 border-t border-rose-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviceFeatures.map((feature, index) => (
              <Link key={index} to={feature.link} className="block cursor-pointer">
                <Card className="bg-white/90 backdrop-blur-sm rounded-2xl border border-rose-100/80 hover:shadow-card hover:border-[#D88A9E]/30 hover:-translate-y-1 transition-all duration-400 ease-[cubic-bezier(0.25,0.8,0.25,1)] group h-full">
                  <CardContent className="p-7 sm:p-8 flex items-center space-x-5 sm:space-x-6 h-full">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-sm ${feature.bgClass}`}>
                      <feature.icon
                        className="w-8 h-8 sm:w-10 sm:h-10 transition-transform duration-300 group-hover:scale-110 text-[#C86D85]"
                      />
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
            ))}
          </div>
        </div>
      </section>
      {/* Footer */}
      <Footer footerSections={footerSections} />
    </div>
  );
};
