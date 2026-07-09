import {
  Loader2,
  Lock,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  ShoppingCartIcon,
  Truck,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useParams } from "wouter";
import { apiGet, listStorage } from "@/lib/api";
import { ProductImageCarousel } from "@/components/ProductImageCarousel";
import { convertImageUrl, onImgError } from "@/lib/imageUtils";
import Header from "@/components/Header";
import { MobileHeader } from "@/components/MobileHeader";
import { useCart } from "@/contexts/CartProvider";
import { toast } from 'react-hot-toast';
import Footer from "@/components/Footer";
import { HEADER_LINKS, NAVIGATION_ITEMS, FOOTER_SECTIONS } from "@/lib/pageData";

const navigationItems = NAVIGATION_ITEMS;
const headerLinks = HEADER_LINKS;
const footerSections = FOOTER_SECTIONS;


export const Details = (): JSX.Element => {
    const { id } = useParams(); // product id from URL
  const [product, setProduct] = useState<any>(null);
  const [categories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
const { cart, addToCart: addToGlobalCart } = useCart();
const [isCartOpen, setIsCartOpen] = useState(false);
const [user, setUser] = useState<any>(null);
const [, setIsWishlisted] = useState(false);
const [selectedQuantity, setSelectedQuantity] = useState(1);
const [similarQuantities, setSimilarQuantities] = useState<Record<number, number>>({});
const getSimilarQty = (id: number) => similarQuantities[id] ?? 1;
const changeSimilarQty = (id: number, delta: number) =>
  setSimilarQuantities((prev) => ({ ...prev, [id]: Math.max(1, (prev[id] ?? 1) + delta) }));
const [, setReviews] = useState<any[]>([]);
const [retryCount, setRetryCount] = useState(0); // optional: prevent infinite reloads

useEffect(() => {
  if (!loading && product === null) {
    if (retryCount < 3) { // retry up to 3 times to avoid infinite loop
      console.warn("Product not found, reloading page...");
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        window.location.reload();
      }, 2000); // reload after 2 seconds
    } else {
      console.error("Product still not found after 3 retries");
    }
  }
}, [loading, product, retryCount]);
useEffect(() => {
  const sessionData = localStorage.getItem('clientSession');
  if (sessionData) {
    try {
      const parsed = JSON.parse(sessionData);
      setUser(parsed);
      console.log("User from localStorage:", parsed); // ✅ Debug
    } catch (e) {
      console.error("Invalid clientSession format", e);
    }
  }
}, []);
useEffect(() => {
  fetchReviews();
}, []);

const fetchReviews = async () => {
  try {
    const data = await apiGet(`/api/product-reviews?productId=${id}`);
    if (data) setReviews(data);
  } catch (error) {
    // silently ignore, matching prior no-op-on-error behavior
  }
};
useEffect(() => {
  const session = localStorage.getItem('clientSession');
  if (session) setUser(JSON.parse(session));
}, []);

  // Check if this product is already wishlisted by this user
useEffect(() => {
  const checkWishlist = async () => {
    if (!user) return;

    try {
      const data = await apiGet(`/api/wishlist?userId=${user.id}&productId=${id}&single=1`);
      if (data) setIsWishlisted(true);
    } catch (error) {
      // no-op, matching prior behavior of not surfacing errors
    }
  };

  checkWishlist();
}, [user, id]);

useEffect(() => {
    console.log("🟡 useParams id =", id, "type:", typeof id);
  if (!id) return;

  async function fetchProduct() {
    setLoading(true);

    const numericId = Number(id); // ✅ convert string to number

    let productData: any = null;
    try {
      productData = await apiGet(`/api/products/${numericId}`);
    } catch (error) {
      console.error("Error fetching product:", error);
      setProduct(null);
      setLoading(false);
      return;
    }

    if (!productData) {
      console.error("Error fetching product: not found");
      setProduct(null);
      setLoading(false);
      return;
    }

    // 2. Fetch category name
    let categoryName = "Uncategorized";
    if (productData.category_id) {
      try {
        const allCategories = await apiGet("/api/categories");
        const categoryData = (allCategories || []).find((c: any) => c.id === productData.category_id);
        if (categoryData) {
          categoryName = categoryData.name;
        }
      } catch {
        // keep default categoryName on error
      }
    }

    // 3. Fetch ALL product images
    let imageUrls: string[] = [];
    if (productData.image_path) {
      if (productData.image_path.startsWith("http")) {
        imageUrls = [productData.image_path];
      } else {
        const folder = productData.image_path.replace(/^image\//, "");
        try {
          const files = await listStorage(`image/${folder}`);
          if (files && files.length > 0) {
            const sorted = files.sort((a, b) => a.name.localeCompare(b.name));
            imageUrls = sorted.map((file) => file.url);
          }
        } catch {
          // keep imageUrls empty on error
        }
      }
    }

    // 4. Save enriched product
    const enrichedProduct = { ...productData, categoryName, imageUrls };
    setProduct(enrichedProduct);

    // 5. Fetch similar products
  // 5️⃣ Fetch similar products
if (productData.category_id) {
  let similar: any[] = [];
  try {
    similar = await apiGet(
      `/api/products?categoryId=${Number(productData.category_id)}&activeOnly=1&inStockOnly=1&withPriceOnly=1&excludeId=${productData.id}&limit=5`
    );
  } catch (similarError) {
    console.error("❌ Error fetching similar:", similarError);
    return;
  }

  if (!similar?.length) {
    console.warn("⚠️ No similar products found");
    return;
  }

  const similarWithImages = await Promise.all(
    similar.map(async (p) => {
      let imageUrl = null;
      if (p.image_path) {
        const folder = p.image_path.startsWith("image/")
          ? p.image_path
          : `image/${p.image_path}`;
        try {
          const files = await listStorage(folder);
          if (files?.length) {
            const sorted = files.sort((a, b) => a.name.localeCompare(b.name));
            imageUrl = sorted[0].url;
          }
        } catch (listError: any) {
          console.warn("⚠️ List error for", folder, listError?.message || listError);
        }
      }
      return { ...p, imageUrl };
    })
  );

  console.log("✅ Similar products fetched:", similarWithImages.length);
  setSimilarProducts(similarWithImages);
}


    setLoading(false);
  }

  fetchProduct();
}, [id]);
const showToast = (message: string, type: "cart" | "wishlist" = "cart") => {
  if (message.includes('Erreur') || message.includes('déjà')) {
    toast.error(message, {
      style: { borderRadius: '10px', background: '#333', color: '#fff' }
    });
  } else {
    toast.success(message, {
      style: { borderRadius: '10px', background: '#fff', color: '#333', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
      iconTheme: { primary: type === "wishlist" ? '#ef4444' : '#1D8EE6', secondary: '#fff' }
    });
  }
};

const addToCart = (product: any, qty: number = 1) => {
  const exists = cart.find((item) => String(item.id) === String(product.id));
  if (exists) {
    showToast("Produit déjà dans le panier !");
    return;
  }
  
  addToGlobalCart({
    ...product,
    id: String(product.id),
    imageUrl: product.imageUrls?.[0] ?? "/fallback.png",
    discounted_price: product.discounted_price || product.original_price || 0,
    quantity: qty,
    tva: product.tva ?? product.discount_percentage,
  });
  showToast("Produit ajouté au panier !");
};

if (loading) return   <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="w-12 h-12 text-app-primary animate-spin mb-4" />
      <p className="text-gray-600 text-lg font-medium">Chargement en cours...</p>
    </div>;

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

      {/* Breadcrumb Hero */}
      <section className="w-full h-[160px] md:h-[200px] relative bg-[url(/figmaAssets/products/rectangle-230.png)] bg-cover bg-center">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(29,142,230,0.85)_0%,rgba(235,245,252,0.4)_100%)]" />
        <div className="relative px-6 md:px-[84px] py-8 md:py-[57px]">
          <h1 className="font-bold text-white text-2xl md:text-[32px] tracking-[0] leading-[normal] mb-4">Fiche Produit</h1>
          <div className="font-medium text-white/80 text-sm md:text-base tracking-[0] leading-[normal]">
            Accueil &gt; Produits {product && <> &gt; <span className="truncate max-w-xs inline-block align-middle">{product.name}</span></>}
          </div>
        </div>
      </section>


      {/* Main Product Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Product Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-16">

          {/* Product Image */}
          <div className="bg-slate-50/50 rounded-2xl p-3 sm:p-6 border border-slate-100 flex items-center justify-center min-h-[180px] sm:min-h-[380px]">
            <ProductImageCarousel image={product.image_path} />
          </div>

          {/* Product Details */}
          <div className="space-y-6 pt-2">

            {/* Discount badge */}
            {!!(product.original_price && product.discounted_price && product.discounted_price < product.original_price) && (
              <span className="inline-block bg-rose-50 text-rose-600 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg">
                -{Math.round((1 - product.discounted_price / product.original_price) * 100)}% de réduction
              </span>
            )}

            {/* Brand */}
            {!!product.brand && (
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{product.brand}</p>
            )}

            {/* Name */}
            <h2 className="font-extrabold text-slate-800 text-2xl lg:text-3xl leading-tight">{product.name}</h2>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              {!!(product.original_price && product.discounted_price && product.discounted_price < product.original_price) && (
                <span className="line-through decoration-[#1D8EE6]/60 decoration-[1.5px] text-slate-400 text-lg font-medium">
                  {Number(product.original_price).toFixed(3)} TND
                </span>
              )}
              <span className="text-[#1D8EE6] text-3xl font-extrabold">
                {Number(product.discounted_price && product.discounted_price > 0 ? product.discounted_price : product.original_price).toFixed(3)} TND
              </span>
            </div>

            {/* Categories */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <span
                  key={cat.name}
                  className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  {cat.name}
                </span>
              ))}
            </div>


            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl w-fit">
                <button 
                  type="button"
                  onClick={() => setSelectedQuantity(prev => Math.max(1, prev - 1))}
                  className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-800 font-bold transition-colors"
                >
                  −
                </button>
                <span className="w-10 text-center font-semibold text-slate-850 text-sm select-none">{selectedQuantity}</span>
                <button 
                  type="button"
                  onClick={() => {
                    if (product) {
                      const stockVal = product.form !== null && product.form !== undefined && product.form !== "" ? Number(product.form) : null;
                      const maxOrderable = stockVal !== null ? stockVal - 3 : null;
                      if (maxOrderable !== null && selectedQuantity + 1 > maxOrderable) {
                        toast.error(`Maximum ${maxOrderable} article${maxOrderable > 1 ? 's' : ''} commandable${maxOrderable > 1 ? 's' : ''} pour ce produit.`, {
                          style: { borderRadius: '10px', background: '#333', color: '#fff' }
                        });
                        return;
                      }
                    }
                    setSelectedQuantity(prev => prev + 1);
                  }}
                  className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-800 font-bold transition-colors"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => {
                  addToCart(product, selectedQuantity);
                  setSelectedQuantity(1); // reset after adding
                }}
                className="flex items-center gap-2 bg-[#1D8EE6] hover:bg-blue-600 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                <ShoppingBag className="w-4 h-4" />
                AJOUTER AU PANIER
              </button>

            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              {[
                { icon: Truck, title: "Livraison rapide", desc: "Partout en Tunisie", color: "#1D8EE6", bg: "#EBF5FF" },
                { icon: ShieldCheck, title: "Produits authentiques", desc: "Garantie d'origine", color: "#10b981", bg: "#ecfdf5" },
                { icon: Lock, title: "Procéder au paiement", desc: "100% protégé", color: "#f59e0b", bg: "#fffbeb" },
                { icon: RotateCcw, title: "Retours faciles", desc: "Sous 14 jours", color: "#8b5cf6", bg: "#f5f3ff" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:shadow-sm transition-shadow duration-200">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: item.bg }}>
                    <item.icon className="w-[18px] h-[18px]" style={{ color: item.color }} strokeWidth={2.2} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-700 leading-tight">{item.title}</span>
                    <span className="text-[11px] text-slate-400 leading-tight">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts && similarProducts.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="font-bold text-slate-800 text-2xl whitespace-nowrap">Produits similaires</h2>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {similarProducts.map((prod) => (
                prod && (
                  <Link
                    key={prod.id}
                    to={`/detailsprod/${prod.id}`}
                    className="block group"
                  >
                    <Card className="bg-white rounded-2xl border border-slate-100 hover:border-[#1D8EE6]/25 hover:shadow-md transition-all duration-300 overflow-hidden">
                      <CardContent className="p-4 flex flex-col">
                        <div className="bg-slate-50/50 rounded-xl mb-3 flex items-center justify-center h-36 overflow-hidden p-2">
                          {prod.image_path ? (
                            <img
                              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                              alt={prod.name}
                              src={convertImageUrl(prod.image_path)}
                              onError={onImgError}
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center text-slate-300 text-xs">
                              Aucune image
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-slate-700 text-xs leading-snug mb-2 line-clamp-2 group-hover:text-[#1D8EE6] transition-colors">
                          {prod.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-auto mb-2">
                          {prod.original_price && prod.discounted_price && prod.discounted_price < prod.original_price && (
                            <span className="font-medium text-slate-400 text-[10px] line-through decoration-[#1D8EE6]/60 decoration-[1.5px]">
                              {Number(prod.original_price).toFixed(3)} TND
                            </span>
                          )}
                          <span className="font-extrabold text-[#1D8EE6] text-sm">
                            {Number(prod.discounted_price && prod.discounted_price > 0 ? prod.discounted_price : prod.original_price).toFixed(3)} TND
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1.5 mt-2">
                          <div className="flex items-center bg-slate-50 border border-slate-200/60 rounded-lg p-0.5 shadow-sm">
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); changeSimilarQty(prod.id, -1); }}
                              className="w-5 h-5 rounded-full text-slate-500 hover:text-[#1D8EE6] hover:bg-white flex items-center justify-center text-xs font-bold transition"
                            >−</button>
                            <span className="w-6 text-center text-[10px] sm:text-xs font-semibold text-slate-700">{getSimilarQty(prod.id)}</span>
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); changeSimilarQty(prod.id, 1); }}
                              className="w-5 h-5 rounded-full text-slate-500 hover:text-[#1D8EE6] hover:bg-white flex items-center justify-center text-xs font-bold transition"
                            >+</button>
                          </div>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(prod, getSimilarQty(prod.id)); }}
                            className="w-7 h-7 sm:w-8 sm:h-8 bg-[#1D8EE6] text-white rounded-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition"
                          >
                            <ShoppingCartIcon className="w-3.5 h-3.5 text-white" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Footer */}
      <Footer footerSections={footerSections} />
    </div>
  );
};
