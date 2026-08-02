// src/components/Header.jsx
import React, { useEffect, useRef, useState } from "react";
import { convertImageUrl, onImgError } from "@/lib/imageUtils";
import AnnouncementBar from "./AnnouncementBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserIcon, ShoppingBasket } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiGet, fetchAllProducts } from "@/lib/api";
import { navigate } from "wouter/use-browser-location";
import { useCart } from "@/contexts/CartProvider";
import toast from "react-hot-toast";

export default function Header({
  headerLinks,
  setIsCartOpen,
  isCartOpen,
}: {
  headerLinks: { name: string; href: string }[];
  navigationItems?: any;
  setIsCartOpen: (v: boolean) => void;
  isCartOpen: boolean;
}) {
  const { cart, updateQuantity, removeFromCart } = useCart();

  const [products, setProducts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [, setLocation] = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);

  // Close cart dropdown when clicking outside
  useEffect(() => {
    if (!isCartOpen) return;
    const handleClickOutside = () => setIsCartOpen(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isCartOpen]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const allProducts = await fetchAllProducts("/api/products?activeOnly=1&inStockOnly=1&withPriceOnly=1&tvaOnly=1");
        setProducts(allProducts);
      } catch (error: any) {
        console.error("Error fetching products in search Header:", error.message);
      }
    };

    fetchData();
  }, []);

  const normalize = (str: string) =>
    str
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase() || "";

  // Filter when query changes
  useEffect(() => {
    const q = normalize(query);
    if (q.length > 0) {
      const searchWords = q.split(" ");
      const res = products.filter((p) => {
        const haystack = normalize(`${p.name ?? ""} ${p.brand ?? ""}`);
        return searchWords.every(word => haystack.includes(word));
      });
      res.sort((a, b) => {
        const hasImgA = !!a.image_path;
        const hasImgB = !!b.image_path;
        if (hasImgA && !hasImgB) return -1;
        if (!hasImgA && hasImgB) return 1;
        return 0;
      });
      setFiltered(res);
      setShowModal(true);
    } else {
      setFiltered([]);
      setShowModal(false);
    }
  }, [query, products]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const incrementQuantity = async (productId: any) => {
    const item = cart.find(i => String(i.id) === String(productId));
    if (!item) return;

    const product = await apiGet(`/api/products/${Number(productId)}?fields=form`).catch(() => null);

    if (!product) {
      updateQuantity(String(productId), item.quantity + 1);
      return;
    }

    const stockVal = product.form !== null && product.form !== undefined && product.form !== ""
      ? Number(product.form)
      : null;

    const maxOrderable = stockVal !== null ? stockVal - 3 : null;
    if (maxOrderable !== null && item.quantity + 1 > maxOrderable) {
      toast.error(`Maximum ${maxOrderable} article${maxOrderable > 1 ? 's' : ''} commandable${maxOrderable > 1 ? 's' : ''} pour ce produit.`, {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      return;
    }

    updateQuantity(String(productId), item.quantity + 1);
  };

  const decrementQuantity = (productId: any) => {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    if (item.quantity <= 1) {
      removeFromCart(String(productId));
    } else {
      updateQuantity(String(productId), item.quantity - 1);
    }
  };

  return (
    <>
      <AnnouncementBar />
      {/* Header */}
      <header className="glass shadow-soft sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between py-2">
            {/* Logo */}
            <Link to="/">
              <img
                className="h-10 sm:h-12 md:h-14 w-auto cursor-pointer object-contain scale-110 sm:scale-[1.7] transform origin-left ml-2 sm:-ml-8"
                alt="YJ PARA logo"
                src="/figmaAssets/logo YJPARA.jpeg"
                onClick={() => {
                  window.location.href = "/";
                }}
              />
            </Link>

            {/* Header links */}
            <div className="hidden lg:flex items-center space-x-14">
              {headerLinks.map((link, index) => (
                <Link key={index} to={link.href}>
                  <Button className="font-medium text-slate-600 text-base bg-transparent border-0 p-0 h-auto hover:bg-transparent hover:text-[#1D8EE6] transition-colors focus:ring-0 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-[#1D8EE6] hover:after:w-full after:transition-all after:duration-300">
                    {link.name}
                  </Button>
                </Link>
              ))}
            </div>

            {/* Search bar */}
            <div className="relative -ml-10" ref={searchRef}>
              {/* Search input */}
              <div className="hidden md:flex relative ml-16">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && query.trim()) {
                      setQuery("");
                      setShowModal(false);
                      setLocation(`/products?search=${encodeURIComponent(query.trim())}`);
                    }
                  }}
                  className="search-premium w-96 lg:w-[371px]"
                  style={{ paddingRight: query.trim().length > 0 ? "64px" : "40px" }}
                  placeholder="Rechercher un produit..."
                />
                {query.trim().length > 0 && (
                  <button
                    onMouseDown={(e) => { e.preventDefault(); setQuery(""); setShowModal(false); }}
                    className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (query.trim()) {
                      setQuery("");
                      setShowModal(false);
                      setLocation(`/products?search=${encodeURIComponent(query.trim())}`);
                    }
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                >
                  <img
                    className="w-4 h-4"
                    alt="Search"
                    src="/figmaAssets/vector.png"
                  />
                </button>
              </div>
            </div>

            {/* Cart + user */}
            <div className="flex items-center space-x-5 ml-7">
              {/* Cart icon + dropdown popup */}
              <div className="relative">
                <ShoppingBasket
                  className="w-6 h-6 cursor-pointer text-[#1D8EE6] hover:scale-110 transition-transform duration-300"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsCartOpen(!isCartOpen);
                  }}
                />
                {cart.length > 0 && (
                  <div
                    className="absolute -top-2 -right-2 w-5 h-5 bg-[#1D8EE6] shadow-sm rounded-full flex items-center justify-center animate-pulse-glow cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsCartOpen(!isCartOpen);
                    }}
                  >
                    <span className="text-white text-[10px] font-bold">{cart.length}</span>
                  </div>
                )}

                {/* Dropdown popup */}
                {isCartOpen && (
                  <div
                    className="absolute right-0 top-10 z-[999] w-[360px] bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] border border-slate-100 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-l border-t border-slate-100 rotate-45" />

                    <div className="p-5">
                      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                        <h4 className="text-base font-bold text-slate-800">
                          🛒 Mon Panier
                          {cart.length > 0 && (
                            <span className="ml-2 text-xs font-semibold bg-blue-50 text-[#1D8EE6] px-2 py-0.5 rounded-full">{cart.length} article{cart.length > 1 ? 's' : ''}</span>
                          )}
                        </h4>
                        <button
                          className="text-slate-400 hover:text-slate-600 text-lg leading-none transition-colors hover:bg-slate-100 w-7 h-7 rounded-full flex items-center justify-center"
                          onClick={() => setIsCartOpen(false)}
                        >
                          ✕
                        </button>
                      </div>

                      {cart.length > 0 ? (
                        <>
                          <ul className="space-y-3 max-h-[260px] overflow-y-auto pr-1 mb-4">
                            {cart.map((item, index) => (
                              <li key={index} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 relative pr-8">
                                <img
                                  src={convertImageUrl(item.image_path || item.image || item.imageUrl)}
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                                  onError={onImgError}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-slate-800 line-clamp-1">{item.name}</p>
                                  <p className="text-xs font-bold text-[#1D8EE6] mt-0.5">{((item.discounted_price > 0 ? item.discounted_price : item.original_price) || item.price || 0).toFixed(3)} TND</p>
                                  <div className="flex items-center mt-1.5 bg-white rounded-lg border border-slate-200 w-fit">
                                    <button onClick={() => decrementQuantity(item.id)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-800 text-sm rounded-l-lg transition-colors">−</button>
                                    <span className="text-xs font-medium w-6 text-center">{item.quantity}</span>
                                    <button onClick={() => incrementQuantity(item.id)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-800 text-sm rounded-r-lg transition-colors">+</button>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeFromCart(String(item.id))}
                                  className="absolute top-2.5 right-2.5 text-slate-400 hover:text-rose-500 transition-colors w-5 h-5 rounded-full flex items-center justify-center hover:bg-slate-200/50 text-[10px]"
                                  title="Supprimer"
                                >
                                  ✕
                                </button>
                              </li>
                            ))}
                          </ul>

                          {(() => {
                            const sousTotal = cart.reduce((sum, item) => sum + ((item.discounted_price > 0 ? item.discounted_price : item.original_price) || item.price || 0) * item.quantity, 0);
                            const threshold = 69;
                            const progress = Math.min((sousTotal / threshold) * 100, 100);
                            const remaining = threshold - sousTotal;
                            return (
                              <div className="mb-4 px-1">
                                {remaining > 0 ? (
                                  <p className="text-xs text-slate-600 mb-2">
                                    Ajoutez <span className="font-bold text-[#1D8EE6]">{remaining.toFixed(3)} TND</span> au panier et bénéficiez de la <span className="font-bold">livraison gratuite</span> !
                                  </p>
                                ) : (
                                  <p className="text-xs font-semibold text-green-600 mb-2">Votre commande est éligible pour la livraison gratuite 🎉</p>
                                )}
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%`, backgroundColor: remaining > 0 ? '#1D8EE6' : '#22c55e' }}
                                  />
                                </div>
                              </div>
                            );
                          })()}

                          <div className="border-t border-slate-100 pt-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-slate-500 font-medium">Total</span>
                              <span className="text-lg font-bold text-[#1D8EE6]">
                                {cart.reduce((total, item) => total + ((item.discounted_price > 0 ? item.discounted_price : item.original_price) || item.price || 0) * item.quantity, 0).toFixed(3)} TND
                              </span>
                            </div>
                            <p className="text-right text-[10px] text-slate-400 mb-3">
                              dont <span className="font-semibold">{cart.reduce((sum, item) => { const priceTtc = ((item.discounted_price > 0 ? item.discounted_price : item.original_price) || item.price || 0) * item.quantity; const tvaRate = item.tva !== undefined && item.tva !== null ? parseFloat(String(item.tva)) : 0; return sum + (tvaRate > 0 ? priceTtc * tvaRate / (100 + tvaRate) : 0); }, 0).toFixed(3)} TND</span> TVA
                            </p>
                            <button
                              className="w-full bg-[#1D8EE6] hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 text-sm"
                              onClick={() => {
                                localStorage.setItem("checkoutCart", JSON.stringify(cart));
                                setIsCartOpen(false);
                                navigate("/checkout");
                              }}
                            >
                              Procéder au paiement →
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="py-8 flex flex-col items-center">
                          <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-3xl">🛒</div>
                          <p className="text-slate-400 text-sm font-medium">Ton panier est vide</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div
                className="hidden sm:block text-[#1D8EE6] font-semibold cursor-pointer hover:text-blue-600 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsCartOpen(true);
                }}
              >
                {cart
                  .reduce(
                    (total, item) => total + ((item.discounted_price > 0 ? item.discounted_price : item.original_price) || item.price || 0) * item.quantity,
                    0
                  )
                  .toFixed(3)}{" "}
                TND
              </div>

              {/* User icon */}
              <Link to="/dashboard">
                <UserIcon className="w-6 h-6 cursor-pointer text-[#1D8EE6] hover:text-blue-600 hover:scale-110 transition-all ml-10" />
              </Link>
            </div>
          </div>

          {/* Mobile search */}
          <div className="md:hidden pb-4">
            <div className="relative">
              <Input
                className="w-full h-12 bg-slate-100 rounded-full px-6 pr-12 border-0 placeholder:text-slate-600"
                placeholder="Recherche..."
              />
              <img
                className="absolute w-4 h-4 top-1/2 right-4 transform -translate-y-1/2"
                alt="Search"
                src="/figmaAssets/vector.png"
              />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
