
import React, { useEffect, useRef, useState } from "react";
import { convertImageUrl, onImgError } from "@/lib/imageUtils";
import ReactDOM from "react-dom";
import AnnouncementBar from "./AnnouncementBar";
import { Link, useLocation } from "wouter";
import { apiGet, fetchAllProducts } from "@/lib/api";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import { X, Home, Info, ShoppingBag, Phone, ChevronRight } from "lucide-react";
import { useCart } from "@/contexts/CartProvider";
import toast from "react-hot-toast";

interface NavLink {
  name: string;
  href: string;
}

interface MobileHeaderProps {
  navLinks: NavLink[];
}

export const MobileHeader = ({ navLinks }: MobileHeaderProps) => {
  const { cart, removeFromCart, updateQuantity, total } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const [products, setProducts] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Fetch products
useEffect(() => {
  const fetchProducts = async () => {
    let allProducts: any[] = [];
    try {
      allProducts = await fetchAllProducts("/api/products?activeOnly=1&inStockOnly=1&withPriceOnly=1&tvaOnly=1");
    } catch (error: any) {
      console.error("Error fetching products in search MobileHeader:", error.message);
    }

    setProducts(
      allProducts.map((p) => ({
        ...p,
        imageUrl: p.image_path || "/placeholder.png", // fallback image
      }))
    );
  };

  fetchProducts();
}, []);
const normalize = (str: string) =>
  str
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // accents
    .replace(/\s+/g, " ")             // multiple spaces → single
    .replace(/\u00A0/g, " ")          // non-breaking spaces
    .replace(/[\u200B-\u200D]/g, "")  // zero-width chars
    .replace(/[^\x20-\x7E]/g, "")     // remove invisible chars
    .trim()
    .toLowerCase() || "";

const searchRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const term = normalize(query);
  if (!term) {
    setFiltered([]);
    setShowModal(false);
    return;
  }

  const searchWords = term.split(" ");
  const res = products.filter(p => {
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
  setShowModal(res.length > 0);
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



  const incrementQuantity = async (id: string) => {
    const item = cart.find(i => String(i.id) === String(id));
    if (!item) return;

    const product = await apiGet(`/api/products/${Number(id)}?fields=form`).catch(() => null);

    if (!product) {
      updateQuantity(id, item.quantity + 1);
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

    updateQuantity(id, item.quantity + 1);
  };

  const decrementQuantity = (id: string) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    if (item.quantity <= 1) {
      removeFromCart(id);
    } else {
      updateQuantity(id, item.quantity - 1);
    }
  };




  // Close menu on clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
    <div className="w-full bg-white/90 backdrop-blur-xl sticky top-0 z-50 shadow-sm border-b border-slate-100">
      <AnnouncementBar />

      {menuOpen && ReactDOM.createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex' }}>
          {/* Dark overlay */}
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.5)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
            onClick={() => setMenuOpen(false)} 
          />
          {/* Sidebar drawer */}
          <div 
            className="animate-slide-in-right"
            style={{
              position: 'relative',
              width: '290px',
              height: '100vh',
              background: '#ffffff',
              boxShadow: '4px 0 40px rgba(0,0,0,0.15)',
              borderTopRightRadius: '24px',
              borderBottomRightRadius: '24px',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              zIndex: 100000,
            }}
          >
            {/* Drawer Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 20px 16px',
              borderBottom: '1px solid #f1f5f9',
            }}>
              <img 
                style={{ width: '95px', height: 'auto', objectFit: 'contain' }} 
                alt="YJ PARA logo" 
                src="/figmaAssets/logo YJPARA.jpeg" 
              />
              <button 
                style={{
                  width: '34px', height: '34px',
                  borderRadius: '50%',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
                onClick={() => setMenuOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Navigation Links */}
            <nav style={{ flex: 1, padding: '12px 12px' }}>
              {/* Home */}
              <Link
                to="/"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '13px 14px',
                  borderRadius: '14px',
                  marginBottom: '4px',
                  background: location === '/' ? 'rgba(29,142,230,0.09)' : 'transparent',
                  color: location === '/' ? '#1D8EE6' : '#334155',
                  fontWeight: 600,
                  fontSize: '14px',
                  textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Home size={18} style={{ opacity: 0.8 }} />
                  Accueil
                </span>
                <ChevronRight size={15} style={{ opacity: 0.4 }} />
              </Link>

              {/* Dynamic links */}
              {navLinks.map((link, idx) => {
                const isActive = location === link.href;
                let IconComponent = Info;
                if (link.href.includes('product')) IconComponent = ShoppingBag;
                if (link.href.includes('contact')) IconComponent = Phone;
                if (link.href.includes('propos')) IconComponent = Info;

                return (
                  <Link
                    key={idx}
                    to={link.href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '13px 14px',
                      borderRadius: '14px',
                      marginBottom: '4px',
                      background: isActive ? 'rgba(29,142,230,0.09)' : 'transparent',
                      color: isActive ? '#1D8EE6' : '#334155',
                      fontWeight: 600,
                      fontSize: '14px',
                      textDecoration: 'none',
                      transition: 'background 0.15s',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <IconComponent size={18} style={{ opacity: 0.8 }} />
                      {link.name}
                    </span>
                    <ChevronRight size={15} style={{ opacity: 0.4 }} />
                  </Link>
                );
              })}
            </nav>

            {/* Footer Social */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <a 
                href="https://www.facebook.com/profile.php?id=61591004090475" 
                target="_blank" 
                rel="noreferrer"
                style={{
                  width: '36px', height: '36px',
                  borderRadius: '50%',
                  background: '#f0f7ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#1D8EE6',
                }}
              >
                <FaFacebookF size={14} />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer"
                style={{
                  width: '36px', height: '36px',
                  borderRadius: '50%',
                  background: '#f0f7ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#1D8EE6',
                }}
              >
                <FaInstagram size={14} />
              </a>
              <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '4px', lineHeight: '1.4' }}>
                YJ PARA COPYRIGHT © 2026<br />
                <span style={{ fontSize: '8px' }}>powered by GenZ builders</span>
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="w-full flex justify-center mt-3 px-4 relative z-50">
        <div className="relative w-full max-w-[371px]" ref={searchRef}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (filtered.length > 0) setShowModal(true); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) {
                setQuery("");
                setShowModal(false);
                setLocation(`/products?search=${encodeURIComponent(query.trim())}`);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="search-premium w-full h-12"
            style={{ paddingRight: query.trim().length > 0 ? "70px" : "40px" }}
            placeholder="Rechercher un produit..."
          />
          {query.trim().length > 0 && (
            <span className="absolute right-11 top-1/2 transform -translate-y-1/2 text-xs font-bold text-[#1D8EE6] bg-[#EBF5FC] px-2.5 py-0.5 rounded-full pointer-events-none">
              {filtered.length}
            </span>
          )}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              if (query.trim()) {
                setQuery("");
                setShowModal(false);
                setLocation(`/products?search=${encodeURIComponent(query.trim())}`);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="absolute top-1/2 right-5 transform -translate-y-1/2"
            aria-label="Rechercher"
          >
            <img className="w-4 h-4 opacity-60" alt="Search icon" src="/figmaAssets/vector.png" />
          </button>

          {/* Search results dropdown */}
          {showModal && (
            <div className="absolute left-0 top-14 w-full bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] border border-slate-100 z-[999] max-h-[60vh] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-slate-400 text-sm">Aucun produit trouvé pour <span className="font-semibold text-slate-600">"{query}"</span></p>
                </div>
              ) : (
                <ul className="py-2">
                  {filtered.map((product) => (
                    <li
                      key={product.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setQuery("");
                        setShowModal(false);
                        setLocation(`/detailsprod/${product.id}`);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      <img
                        src={convertImageUrl(product.image_path) || "/placeholder.png"}
                        alt={product.name}
                        className="w-11 h-11 object-cover rounded-xl flex-shrink-0 border border-slate-100"
                        onError={onImgError}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 line-clamp-2">{product.name}</p>
                        <p className="text-sm font-bold text-[#1D8EE6] mt-0.5">
                          {(parseFloat(product.discounted_price) > 0 ? parseFloat(product.discounted_price) : parseFloat(product.original_price) || 0).toFixed(3)} DT
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>



      <div className="flex items-center justify-between px-3 py-3">
        <Link href="/">
          <img className="w-[90px] h-auto object-contain" alt="YJ PARA logo" src="/figmaAssets/logo YJPARA.jpeg" />
        </Link>
        <div className="flex items-center gap-2">
            {/* Cart icon + dropdown popup */}
            <div className="relative">
              <div
                className="relative w-[26px] h-7 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setIsCartOpen(!isCartOpen); }}
              >
                <div className="w-[26px] h-[26px] bg-card-background rounded-full flex items-center justify-center">
                  <img className="w-4 h-[13px]" alt="Cart" src="/figmaAssets/homem/vector.svg" />
                </div>
                {cart.length > 0 && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-[#1D8EE6] shadow-sm ring-2 ring-white rounded-full flex items-center justify-center cursor-pointer animate-pulse-glow">
                    <span className="text-white text-[10px] font-bold">{cart.length}</span>
                  </div>
                )}
              </div>

              {/* Dropdown popup via portal — always fits viewport */}
              {isCartOpen && ReactDOM.createPortal(
                <div style={{ position: 'fixed', inset: 0, zIndex: 9997 }}>
                  {/* Backdrop */}
                  <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.15)' }}
                    onClick={() => setIsCartOpen(false)}
                  />
                  {/* Cart panel */}
                  <div
                    style={{
                      position: 'fixed',
                      top: '130px',
                      left: '8px',
                      right: '8px',
                      zIndex: 9998,
                      background: '#ffffff',
                      borderRadius: '20px',
                      boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
                      border: '1px solid #f1f5f9',
                      overflow: 'hidden',
                      maxWidth: '440px',
                      margin: '0 auto',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >

                  <div className="p-4">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-100">
                      <h4 className="text-sm font-bold text-slate-800">
                        Mon Panier
                        {cart.length > 0 && (
                          <span className="ml-2 text-[10px] font-semibold bg-blue-50 text-[#1D8EE6] px-2 py-0.5 rounded-full">{cart.length} article{cart.length > 1 ? 's' : ''}</span>
                        )}
                      </h4>
                      <button
                        className="text-slate-400 hover:text-slate-600 text-base leading-none hover:bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center"
                        onClick={() => setIsCartOpen(false)}
                      >✕</button>
                    </div>

                    {cart.length > 0 ? (
                      <>
                        <ul className="space-y-2 max-h-[220px] overflow-y-auto mb-3">
                          {cart.map((item) => (
                            <li key={item.id} className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                              <img
                                src={convertImageUrl(item.image_path || item.image || item.imageUrl)}
                                alt={item.name}
                                className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                                onError={onImgError}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold text-slate-800 line-clamp-1">{item.name}</p>
                                <p className="text-[11px] font-bold text-[#1D8EE6]">{(parseFloat(String(item.discounted_price ?? 0)) > 0 ? parseFloat(String(item.discounted_price ?? 0)) : parseFloat(String(item.original_price ?? 0)) || 0).toFixed(3)} TND</p>
                                <div className="flex items-center mt-1 bg-white rounded-lg border border-slate-200 w-fit">
                                  <button onClick={() => decrementQuantity(String(item.id))} className="w-5 h-5 flex items-center justify-center text-slate-500 text-xs rounded-l-lg">−</button>
                                  <span className="text-[10px] font-medium w-5 text-center">{item.quantity}</span>
                                  <button onClick={() => incrementQuantity(String(item.id))} className="w-5 h-5 flex items-center justify-center text-slate-500 text-xs rounded-r-lg">+</button>
                                </div>
                              </div>
                              <button onClick={() => removeFromCart(String(item.id))} className="text-rose-400 text-[10px] font-bold bg-rose-50 px-1.5 py-1 rounded-md flex-shrink-0">✕</button>
                            </li>
                          ))}
                        </ul>

                        {/* Free delivery progress bar */}
                        {(() => {
                          const sousTotal = cart.reduce((sum, item) => sum + ((item.discounted_price > 0 ? item.discounted_price : item.original_price) || 0) * item.quantity, 0);
                          const threshold = 69;
                          const progress = Math.min((sousTotal / threshold) * 100, 100);
                          const remaining = threshold - sousTotal;
                          return (
                            <div className="mb-3 px-1">
                              {remaining > 0 ? (
                                <p className="text-[10px] text-slate-600 mb-1.5">
                                  Ajoutez <span className="font-bold text-[#1D8EE6]">{remaining.toFixed(3)} TND</span> et bénéficiez de la <span className="font-bold">livraison gratuite</span> !
                                </p>
                              ) : (
                                <p className="text-[10px] font-semibold text-green-600 mb-1.5">Votre commande est éligible pour la livraison gratuite 🎉</p>
                              )}
                              <div className="w-full bg-slate-100 rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full transition-all duration-500"
                                  style={{ width: `${progress}%`, backgroundColor: remaining > 0 ? '#1D8EE6' : '#22c55e' }}
                                />
                              </div>
                            </div>
                          );
                        })()}

                        <div className="border-t border-slate-100 pt-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-slate-500 font-medium">Total</span>
                            <span className="text-base font-bold text-[#1D8EE6]">{total.toFixed(3)} TND</span>
                          </div>
                          <p className="text-right text-[9px] text-slate-400 mb-2.5">
                            dont <span className="font-semibold">{cart.reduce((sum, item) => { const priceTtc = ((item.discounted_price > 0 ? item.discounted_price : item.original_price) || item.price || 0) * item.quantity; const tvaRate = item.tva !== undefined && item.tva !== null ? parseFloat(String(item.tva)) : 0; return sum + (tvaRate > 0 ? priceTtc * tvaRate / (100 + tvaRate) : 0); }, 0).toFixed(3)} TND</span> TVA
                          </p>
                          <Link to="/checkout" onClick={() => setIsCartOpen(false)}>
                            <button className="w-full bg-[#1D8EE6] hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-colors">
                              Procéder au paiement →
                            </button>
                          </Link>
                        </div>
                      </>
                    ) : (
                      <div className="py-6 flex flex-col items-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-2 text-2xl">🛒</div>
                        <p className="text-slate-400 text-xs font-medium">Ton panier est vide</p>
                      </div>
                    )}
                      </div>
                  </div>
                </div>,
                document.body
              )}
            </div>

            {/* Cart Total Price — cliquable pour ouvrir le panier */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsCartOpen(!isCartOpen); }}
              className="text-[#1D8EE6] font-extrabold text-[13px] whitespace-nowrap shrink-0 ml-1 active:scale-95 transition-all"
            >
              {total.toFixed(3)} TND
            </button>



            {/* Menu Hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="ml-1 active:scale-95 transition-all">
              <img className="w-[30px] h-[18px]" alt="Menu" src="/figmaAssets/homem/vector-3.svg" />
            </button>
        </div>
      </div>

    </div>

    </>
  );
};
