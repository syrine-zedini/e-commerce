import { Eye, Heart, Loader2, Lock, RotateCcw, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import React, { useEffect, useState } from "react";
import { convertImageUrl, onImgError } from "@/lib/imageUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FooterMobile } from "@/components/ui/FooterMobile";
import { MobileHeader } from "@/components/MobileHeader";
import { Link, useParams } from "wouter";
import { apiGet, apiPost, listStorage } from "@/lib/api";
import { ProductImageCarousel } from "@/components/ProductImageCarousel";
import { toast } from "react-hot-toast";
import { navigate } from "wouter/use-browser-location";
import { HEADER_LINKS, FOOTER_SECTIONS, toMobileFooterSections } from "@/lib/pageData";

const footerSections = toMobileFooterSections(FOOTER_SECTIONS);
export const DetailsProduitsMobile = (): JSX.Element => {

        const { id } = useParams(); // product id from URL
  const [product, setProduct] = useState<any>(null);
  const [categories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
const [, setCart] = useState<any[]>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem("cart") : null;
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });
const [user, setUser] = useState<any>(null);
const [isWishlisted, setIsWishlisted] = useState(false);
const [selectedQuantity, setSelectedQuantity] = useState(1);
    const navLinks = HEADER_LINKS;

useEffect(() => {
  const saved = localStorage.getItem("cart");
  if (saved) setCart(JSON.parse(saved));
}, []);

const showToast = (message: string) => {
  if (message.includes('Erreur') || message.includes('déjà')) {
    toast.error(message, {
      style: { borderRadius: '10px', background: '#333', color: '#fff' }
    });
  } else {
    toast.success(message, {
      style: { borderRadius: '10px', background: '#fff', color: '#333', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
      iconTheme: { primary: '#1D8EE6', secondary: '#fff' }
    });
  }
};
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

  const addToWishlist = async () => {
  if (!user) {
    // Save redirect and go to login
    localStorage.setItem('redirectAfterLogin', window.location.href);
    window.location.href = '/dashboard'; // or your login route
    return;
  }

  try {
    await apiPost('/api/wishlist', { user_id: user.id, product_id: id });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    toast.error("Erreur lors de l’ajout aux favoris");
    return;
  }

  setIsWishlisted(true);
  toast.success('Produit ajouté aux favoris !');
};

useEffect(() => {
  async function fetchProduct() {
    setLoading(true);

    // 1. Fetch product by id
    let productData: any = null;
    try {
      productData = await apiGet(`/api/products/${id}`);
    } catch (error) {
      console.error("Error fetching product:", error);
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

    // 4. Save enriched product
    const enrichedProduct = { ...productData, categoryName };
    setProduct(enrichedProduct);

    // 5. Fetch similar products
    if (productData.category_id) {
      let similar: any[] | null = null;
      try {
        similar = await apiGet(
          `/api/products?categoryId=${productData.category_id}&activeOnly=1&inStockOnly=1&withPriceOnly=1&excludeId=${productData.id}&limit=5`
        );
      } catch {
        similar = null;
      }

      if (similar) {
        // build each with first image
        const similarWithImages = await Promise.all(
          similar.map(async (p) => {
            let imageUrl: string | null = null;
            if (p.image_path) {
              const folder = p.image_path.replace(/^image\//, "");
              try {
                const files = await listStorage(`image/${folder}`);
                if (files && files.length > 0) {
                  const sorted = files.sort((a, b) => a.name.localeCompare(b.name));
                  imageUrl = sorted[0].url;
                }
              } catch {
                // keep imageUrl null on error
              }
            }
            return { ...p, imageUrl };
          })
        );
        setSimilarProducts(similarWithImages);
      }
    }

    setLoading(false);
  }

  fetchProduct();
}, [id]);
// const addToCart = (p: any) => {
//   // on construit un objet avec la 1ʳᵉ image
//   const productWithImage = {
//     ...p,
//     imageUrl: p.imageUrls?.[0] ?? null, // prend la première image
//   };

//   setCart((prev) => [...prev, productWithImage]);
// };
const addToCart = (product: any, qty: number = 1) => {
  const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");

  const exists = savedCart.find((item: any) => item.id === product.id);

  // Determine price safely
  const discounted = Number(product.discounted_price ?? 0);
  const original = Number(product.original_price ?? 0);
  const finalPrice = discounted > 0 ? discounted : original;

  if (exists) {
    exists.quantity += qty;
  } else {
    savedCart.push({
      id: product.id,
      name: product.name,
      quantity: qty,
      discounted_price: discounted,
      original_price: original,
      price: finalPrice,
      image_path: product.image_path || "/placeholder.png",
      code: product.code,
      tva: product.discount_percentage,
    });
  }

  localStorage.setItem("cart", JSON.stringify(savedCart));
  setCart(savedCart);
};


  if (loading) return   <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="w-12 h-12 text-app-primary animate-spin mb-4" />
      <p className="text-gray-600 text-lg font-medium">Chargement en cours...</p>
    </div>;
  if (!product) return <p>chargement....</p>;


  return (
    <div className="bg-white grid justify-items-center [align-items:start] w-screen">
      <div className="bg-white overflow-hidden w-[375px] h-[3880px] relative">
      <MobileHeader navLinks={navLinks} />

<main className="px-4 sm:px-8 md:px-12 lg:px-[84px] py-10 sm:py-16 md:py-20 lg:py-[120px]">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-[125px]">
    {/* Product Image */}
    <Card className="bg-card-background rounded-[10px] p-4 sm:p-6 lg:p-[20px]">
      <CardContent className="p-0">
        <ProductImageCarousel image={product.image_path} />
      </CardContent>
    </Card>

    {/* Product Details */}
    <div className="space-y-6">
      <h1 className="font-bold text-black text-2xl sm:text-3xl lg:text-[32px]">
        {product.name}
      </h1>

      {/* Pricing */}
  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
  {!!(product.original_price &&
    product.discounted_price &&
    product.discounted_price < product.original_price) && (
      <span className="line-through decoration-[#1D8EE6]/60 decoration-[1.5px] text-[#b3b3b3] text-lg sm:text-xl lg:text-2xl">
        {product.original_price} TND
      </span>
    )}
  <span className="text-app-secondary text-xl sm:text-2xl font-extrabold">
    {product.discounted_price && product.discounted_price > 0
      ? product.discounted_price
      : product.original_price} TND
  </span>
</div>


      {/* Categories */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <span
            key={cat.name}
            className="inline-flex items-center h-[28px] sm:h-[30px] px-3 bg-light-background rounded-[10px] border border-[#a5a4d2] text-xs sm:text-sm font-normal text-text-dark"
          >
            {cat.name}
          </span>
        ))}
      </div>

      {/* Description */}
      <div>
        <h3 className="font-bold text-black text-lg sm:text-xl mb-3 sm:mb-4">
          Description :
        </h3>
<p className="text-text-dark leading-6 sm:leading-[30px] text-sm sm:text-base">
  {product.description
    .split('\\n')        // split by literal \n
    .slice(0, 2)         // take only the first 2 lines
    .map((line: string, index: number) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ))}
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        {/* Quantity Selector Mobile */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-[30px] w-fit mx-auto sm:mx-0">
          <button 
            type="button"
            onClick={() => setSelectedQuantity(prev => Math.max(1, prev - 1))}
            className="w-12 h-10 flex items-center justify-center text-slate-500 hover:text-slate-800 font-bold transition-colors text-lg"
          >
            −
          </button>
          <span className="w-12 text-center font-semibold text-slate-850 text-base select-none">{selectedQuantity}</span>
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
            className="w-12 h-10 flex items-center justify-center text-slate-500 hover:text-slate-800 font-bold transition-colors text-lg"
          >
            +
          </button>
        </div>

        <Button
          onClick={() => {
            addToCart(product, selectedQuantity);
            showToast(`${product.name} ajouté au panier !`);
            setSelectedQuantity(1);
          }}
          className="bg-accent-soft-lavender rounded-[30px] text-text-light font-semibold flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <ShoppingBag className="w-5 h-5" />
          AJOUTER AU PANIER
        </Button>

        {/* Commander maintenant — same flow as Home page checkout */}
        <Button
          onClick={() => {
            // Add product to cart first
            const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
            const exists = savedCart.find((item: any) => item.id === product.id);
            const discounted = Number(product.discounted_price ?? 0);
            const original = Number(product.original_price ?? 0);
            const finalPrice = discounted > 0 ? discounted : original;
            if (exists) {
              exists.quantity += selectedQuantity;
            } else {
              savedCart.push({
                id: product.id,
                name: product.name,
                quantity: selectedQuantity,
                discounted_price: discounted,
                original_price: original,
                price: finalPrice,
                image_path: product.image_path || "/placeholder.png",
                code: product.code,
              });
            }
            localStorage.setItem("cart", JSON.stringify(savedCart));
            // Save checkoutCart and navigate to checkout — same as Home
            localStorage.setItem("checkoutCart", JSON.stringify(savedCart));
            navigate("/checkout");
          }}
          className="bg-[#1D8EE6] hover:bg-blue-600 rounded-[30px] text-white font-bold flex items-center justify-center gap-2 w-full sm:w-auto shadow-md"
        >
          <ShoppingBag className="w-5 h-5" />
          COMMANDER MAINTENANT
        </Button>

{/* React-hot-toast handles toast notifications */}
        <Button
          onClick={addToWishlist}
          disabled={isWishlisted}
          className="bg-app-primary rounded-[30px] text-text-light font-semibold flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isWishlisted ? "text-red-500" : "text-white"
            }`}
            fill={isWishlisted ? "red" : "none"}
          />
          {isWishlisted ? "AJOUTÉ AUX FAVORIS" : "AJOUTER AUX FAVORIS"}
        </Button>
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-2 gap-2.5 pt-4">
        {[
          { icon: Truck, title: "Livraison rapide", desc: "Partout en Tunisie", color: "#1D8EE6", bg: "#EBF5FF" },
          { icon: ShieldCheck, title: "Produits authentiques", desc: "Garantie d'origine", color: "#10b981", bg: "#ecfdf5" },
          { icon: Lock, title: "Procéder au paiement", desc: "100% protégé", color: "#f59e0b", bg: "#fffbeb" },
          { icon: RotateCcw, title: "Retours faciles", desc: "Sous 14 jours", color: "#8b5cf6", bg: "#f5f3ff" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-white">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: item.bg }}>
              <item.icon className="w-4 h-4" style={{ color: item.color }} strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-700 leading-tight">{item.title}</span>
              <span className="text-[10px] text-slate-400 leading-tight">{item.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* Produits similaires */}
 {similarProducts && similarProducts.length > 0 && (
 <section className="mt-20 sm:mt-32 lg:mt-[400px]">
  <div className="flex items-center gap-4 mb-6 sm:mb-8">
    <h2 className="font-bold text-black text-2xl sm:text-3xl lg:text-[32px]">
      Produits similaires
    </h2>
    <div className="flex-1 h-[3px] bg-gray-200 relative">
      <div className="absolute left-0 top-0 w-[38px] h-[7px] bg-black -mt-0.5" />
    </div>
  </div>

  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-[20px]">
    {similarProducts.map(
      (prod) =>
        prod && (
          <Link key={prod.id} to={`/detailsprod/${prod.id}`} className="block">
            <Card className="bg-card-background rounded-[5px] overflow-hidden cursor-pointer h-full flex flex-col">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="relative w-full flex-shrink-0">
                  {prod.image_path ? (
                    <img
                      className="w-full h-40 sm:h-48 md:h-56 object-cover"
                      alt={prod.name}
                      src={convertImageUrl(prod.image_path)}
                      onError={onImgError}
                    />
                  ) : (
                    <div className="w-full h-40 sm:h-48 md:h-56 bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                      No image
                    </div>
                  )}

                  {/* Add to Cart / View */}
                  <Link
                    to={`/detailsprod/${prod.id}`}
                    className="absolute bottom-3 right-3 w-10 h-10 sm:w-[49px] sm:h-[49px] bg-app-primary rounded-full p-0 flex items-center justify-center"
                  >
                    <Eye className="w-5 h-5 text-white" />
                  </Link>
                </div>

                <div className="p-4 sm:p-[20px] flex flex-col justify-between flex-1">
                  <h3 className="font-medium text-text-dark text-sm sm:text-base leading-5 sm:leading-[23px] mb-2 sm:mb-4 line-clamp-2">
                    {prod.name}
                  </h3>

            <div className="flex items-center gap-2 mt-auto">
  {prod.original_price &&
    prod.discounted_price &&
    prod.discounted_price < prod.original_price && (
      <span className="font-extrabold text-[#b3b3b3] text-xs sm:text-sm line-through decoration-[#1D8EE6]/60 decoration-[1.5px]">
        {prod.original_price} TND
      </span>
    )}
  <span className="font-extrabold text-app-secondary text-sm sm:text-base">
    {prod.discounted_price && prod.discounted_price > 0
      ? prod.discounted_price
      : prod.original_price} TND
  </span>
</div>

                </div>
              </CardContent>
            </Card>
          </Link>
        )
    )}
  </div>
</section>

)}

</main>


        {/* Footer */}
          <FooterMobile sections={footerSections} />

      </div>
    </div>
  );
};
