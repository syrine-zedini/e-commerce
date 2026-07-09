import { useState } from "react";
import { convertImageUrl, onImgError } from "@/lib/imageUtils";
import { apiGet, apiPost } from "@/lib/api";
import { useCart } from "@/contexts/CartProvider";
import Header from "@/components/Header";
import { MobileHeader } from "@/components/MobileHeader";
import Footer from "@/components/Footer";
import toast from "react-hot-toast";
import { TUNISIA_DATA as tunisiaData } from "@/lib/tunisiaData";
import { NAVIGATION_ITEMS, HEADER_LINKS, FOOTER_SECTIONS } from "@/lib/pageData";

export default function CheckoutPage() {
  // Global cart context
  const { cart, updateQuantity, removeFromCart, clearCart: clearGlobalCart } = useCart();

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    phone: "",
    adresse: "",
    ville: "",
    code_postal: "",
    mot_de_passe: "",
    paiement_mode: "livraison",
    ville_personnalisee: "",
  });

  const [selectedProvince, setSelectedProvince] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  const navigationItems = NAVIGATION_ITEMS;
  const headerLinks = HEADER_LINKS;
  const footerSections = FOOTER_SECTIONS;

  const incrementQuantity = async (productId: string | number) => {
    const item = cart.find(i => String(i.id) === String(productId));
    if (item) {
      let product: { form?: any } | null = null;
      try {
        product = await apiGet(`/api/products/${Number(productId)}?fields=form`);
      } catch (error: any) {
        console.error("Error fetching product stock:", error?.message);
        updateQuantity(String(productId), item.quantity + 1);
        return;
      }

      if (!product) {
        updateQuantity(String(productId), item.quantity + 1);
        return;
      }

      const stockVal = product.form !== null && product.form !== undefined && product.form !== "" ? Number(product.form) : null;
      const maxOrderable = stockVal !== null ? stockVal - 3 : null;
      if (maxOrderable !== null && item.quantity + 1 > maxOrderable) {
        toast.error(`Maximum ${maxOrderable} article${maxOrderable > 1 ? 's' : ''} commandable${maxOrderable > 1 ? 's' : ''} pour ce produit.`, {
          style: { borderRadius: '10px', background: '#333', color: '#fff' }
        });
        return;
      }

      updateQuantity(String(productId), item.quantity + 1);
    }
  };

  const decrementQuantity = (productId: string | number) => {
    const item = cart.find(i => String(i.id) === String(productId));
    if (item) {
      if (item.quantity <= 1) {
        removeFromCart(String(productId));
      } else {
        updateQuantity(String(productId), item.quantity - 1);
      }
    }
  };

  const sousTotal = cart.reduce(
    (sum, item) =>
      sum +
      ((item.discounted_price > 0 ? item.discounted_price : item.original_price) ||
        item.price ||
        0) *
        item.quantity,
    0
  );
  const fraisLivraison =
    cart.length === 0
      ? 0
      : sousTotal >= 69
      ? 0
      : 7.2;
  const total = sousTotal + fraisLivraison;

  const totalTVA = cart.reduce((sum, item) => {
    const price = (item.discounted_price > 0 ? item.discounted_price : item.original_price) || item.price || 0;
    const priceTtc = price * item.quantity;
    const tvaRate = item.tva ? Number(item.tva) : 0;
    const itemTVA = tvaRate > 0 ? (priceTtc * tvaRate / (100 + tvaRate)) : 0;
    return sum + itemTVA;
  }, 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1️⃣ Save order via API
      let insertedOrder: any;
      try {
        insertedOrder = await apiPost("/api/commandes", {
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          phone: form.phone,
          adresse: form.adresse,
          province: selectedProvince,
          ville: form.ville,
          code_postal: form.code_postal,
          mot_de_passe: form.mot_de_passe,
          paiement_mode: "livraison",
          frais_livraison: fraisLivraison,
          total: total,
          produits: cart,
          statut: "pending",
        });
      } catch (error) {
        console.error("❌ Erreur API:", error);
        toast.error("❌ Erreur lors de l'enregistrement de la commande");
        return;
      }

      // 2️⃣ Decrement stock for each ordered product
      try {
        const stockItems = cart.map((item) => ({
          id: item.id,
          quantity: item.quantity ?? 1,
        }));
        await fetch("/api/decrement-stock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: stockItems }),
        });
      } catch (stockErr) {
        console.warn("⚠️ Stock decrement failed (non-blocking):", stockErr);
      }

      // 3️⃣ Clear ALL cart storage + the global CartProvider context
      localStorage.removeItem("checkoutCart");
      localStorage.removeItem("florea_cart");
      localStorage.removeItem("cart");
      clearGlobalCart();    // clears Header cart via CartProvider context

      // Clear the form data
      setForm({
        nom: "",
        prenom: "",
        email: "",
        phone: "",
        adresse: "",
        ville: "",
        code_postal: "",
        mot_de_passe: "",
        paiement_mode: "livraison",
        ville_personnalisee: "",
      });
      setSelectedProvince("");
      setCities([]);

      setConfirmedOrderId(insertedOrder?.id ?? null);
      setOrderConfirmed(true);
      toast.success("✅ Commande enregistrée avec succès !");
    } catch (err) {
      console.error("❌ Erreur inattendue:", err);
      toast.error("❌ Une erreur inattendue s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
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

      {/* Hero Section */}
      <section className="w-full h-[200px] relative bg-[url(/figmaAssets/contact/rectangle-230.png)] bg-[100%_100%]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(29,142,230,0.85)_0%,rgba(235,245,252,0.4)_100%)]" />
        <div className="relative px-[84px] py-[57px]">
          <h1 className="[font-family:'Inter',Helvetica] font-bold text-text-light text-[32px] tracking-[0] leading-[normal] mb-4">
            Finaliser la commande
          </h1>
          <div className="[font-family:'Inter',Helvetica] font-medium text-text-light text-base tracking-[0] leading-[normal]">
            Accueil &gt; Panier &gt; Commande
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid gap-8 md:grid-cols-2 items-start">
          {/* LEFT: Cart Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-5 pb-3 border-b border-gray-100">🛒 Votre panier</h3>
            <ul className="space-y-4">
              {cart.map((item, idx) => (
                <li key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <button
                    type="button"
                    onClick={() => removeFromCart(String(item.id))}
                    className="text-gray-400 hover:text-rose-500 transition-colors w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200/60 text-sm font-bold flex-shrink-0"
                    title="Supprimer"
                  >
                    ✕
                  </button>
                  <img
                    src={convertImageUrl(item.image_path || item.image || item.imageUrl)}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    onError={onImgError}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm line-clamp-2">{item.name}</p>
                    <div
                      onClick={() => removeFromCart(String(item.id))}
                      className="mt-0.5 cursor-pointer hover:text-rose-500 transition-colors flex items-center gap-2 flex-wrap"
                      title="Cliquez pour supprimer"
                    >
                      {item.discounted_price && item.discounted_price < (item.original_price || 0) ? (
                        <>
                          <span className="text-sm font-bold text-rose-500">
                            {Number(item.discounted_price).toFixed(3)} TND
                          </span>
                          <span className="text-xs text-gray-400 line-through">
                            {Number(item.original_price).toFixed(3)} TND
                          </span>
                          {item.original_price && Number(item.original_price) > 0 && (
                            <span className="bg-rose-100 text-rose-600 text-[10px] font-black px-1.5 py-0.5 rounded">
                              -{Math.round(((item.original_price - item.discounted_price) / item.original_price) * 100)}%
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-sm font-bold text-app-primary">
                          {((item.discounted_price > 0 ? item.discounted_price : item.original_price) || item.price || 0).toFixed(3)} TND
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <button
                        type="button"
                        onClick={() => decrementQuantity(item.id)}
                        className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors font-bold"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => incrementQuantity(item.id)}
                        className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
              {/* Free delivery progress bar */}
              {(() => {
                const threshold = 69;
                const progress = Math.min((sousTotal / threshold) * 100, 100);
                const remaining = threshold - sousTotal;
                return (
                  <div className="mb-5 pb-4 border-b border-gray-50">
                    {remaining > 0 ? (
                      <p className="text-xs text-gray-600 mb-2">
                        Ajoutez <span className="font-bold text-app-primary">{remaining.toFixed(3)} TND</span> au panier et bénéficiez de la <span className="font-bold">livraison gratuite</span> !
                      </p>
                    ) : (
                      <p className="text-xs font-semibold text-green-600 mb-2">Votre commande est éligible pour la livraison gratuite 🎉</p>
                    )}
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%`, backgroundColor: remaining > 0 ? '#1D8EE6' : '#22c55e' }}
                      />
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-between text-sm text-gray-600">
                <span>Sous-total</span>
                <span className="font-medium">{sousTotal.toFixed(3)} TND</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Frais de livraison</span>
                <span className={`font-medium ${fraisLivraison === 0 ? 'text-green-600' : ''}`}>
                  {fraisLivraison === 0 ? "Gratuite 🎉" : `${fraisLivraison.toFixed(3)} TND`}
                </span>
              </div>
              <div className="flex justify-between items-end pt-3 border-t border-gray-100">
                <span className="text-base font-bold text-gray-900">Total</span>
                <div className="text-right">
                  <span className="text-lg font-bold text-app-primary block">{total.toFixed(3)} TND</span>
                  <span className="text-[10px] text-gray-400 font-medium text-right block">dont {totalTVA.toFixed(3)} TND TVA</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-5 pb-3 border-b border-gray-100">📋 Vos informations</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="nom" className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Nom</label>
                  <input
                    id="nom"
                    name="nom"
                    value={form.nom}
                    onChange={handleChange}
                    type="text"
                    placeholder="Votre nom"
                    autoComplete="one-time-code"
                    className="border border-gray-200 p-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-app-primary/30 focus:border-app-primary transition"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="prenom" className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Prénom</label>
                  <input
                    id="prenom"
                    name="prenom"
                    value={form.prenom}
                    onChange={handleChange}
                    type="text"
                    placeholder="Votre prénom"
                    autoComplete="one-time-code"
                    className="border border-gray-200 p-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-app-primary/30 focus:border-app-primary transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Numéro de téléphone</label>
                <input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  type="number"
                  placeholder="Ex: 25 000 000"
                  autoComplete="one-time-code"
                  className="border border-gray-200 p-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-app-primary/30 focus:border-app-primary transition"
                  required
                />
              </div>

              <div>
                <label htmlFor="adresse" className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Adresse complète</label>
                <input
                  id="adresse"
                  name="adresse"
                  value={form.adresse}
                  onChange={handleChange}
                  type="text"
                  placeholder="Rue, numéro, quartier..."
                  autoComplete="one-time-code"
                  className="border border-gray-200 p-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-app-primary/30 focus:border-app-primary transition"
                  required
                />
              </div>

              {/* Province / City Autocomplete */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="province" className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Gouvernorat</label>
                  <select
                    id="province"
                    name="province"
                    value={selectedProvince}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setSelectedProvince(selected);
                      setCities(
                        tunisiaData[selected] ? [...tunisiaData[selected]] : []
                      );
                      setForm({ ...form, ville: "" });
                    }}
                    className="border border-gray-200 p-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-app-primary/30 focus:border-app-primary transition"
                    required
                  >
                    <option value="">Sélectionnez un gouvernorat</option>
                    {Object.keys(tunisiaData).map((province) => (
                        <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <label htmlFor="ville" className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Ville</label>
                  <div className="relative">
                    <input
                      id="ville"
                      name="ville"
                      type="text"
                      placeholder={selectedProvince ? "Sélectionnez ou tapez..." : "Sélectionnez un gouvernorat"}
                      value={form.ville}
                      onChange={(e) => {
                        setForm({ ...form, ville: e.target.value });
                        setIsCityDropdownOpen(true);
                      }}
                      onFocus={() => {
                        if (selectedProvince) {
                          setIsCityDropdownOpen(true);
                        }
                      }}
                      className="border border-gray-200 p-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-app-primary/30 focus:border-app-primary transition"
                      required
                      disabled={!selectedProvince}
                      autoComplete="off"
                    />
                    {selectedProvince && (
                      <button
                        type="button"
                        onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 focus:outline-none"
                      >
                        <svg className={`w-4 h-4 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {isCityDropdownOpen && selectedProvince && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsCityDropdownOpen(false)}
                      />
                      <ul className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-sm text-gray-700">
                        {(() => {
                          const filtered = cities.filter(city => 
                            city.toLowerCase().includes(form.ville.toLowerCase())
                          );
                          if (filtered.length === 0) {
                            return (
                              <li className="px-4 py-2 text-gray-400 italic">
                                Pas de résultat. Tapez librement.
                              </li>
                            );
                          }
                          return filtered.map((city) => (
                            <li
                              key={city}
                              onClick={() => {
                                setForm({ ...form, ville: city });
                                setIsCityDropdownOpen(false);
                              }}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer transition-colors text-left"
                            >
                              {city}
                            </li>
                          ));
                        })()}
                      </ul>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="code_postal" className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Code postal</label>
                  <input id="code_postal" name="code_postal" value={form.code_postal} onChange={handleChange} type="number" placeholder="Ex: 1000" autoComplete="off" className="border border-gray-200 p-2.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-app-primary/30 focus:border-app-primary transition" required />
                </div>
              </div>

              {/* Payment Mode */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Mode de paiement</p>
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-sm font-semibold text-gray-800">🚚 À la livraison</span>
                  <p className="text-xs text-gray-500">{fraisLivraison.toFixed(3)} DT frais de livraison</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || orderConfirmed || cart.length === 0}
                className={`w-full py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2 mt-2 transition-all ${
                  isLoading || orderConfirmed || cart.length === 0
                    ? "bg-gray-300 cursor-not-allowed text-gray-500"
                    : "bg-app-primary hover:bg-app-primary/90 text-white shadow-md hover:shadow-lg"
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Traitement en cours...
                  </>
                ) : (
                  "✅ Confirmer la commande"
                )}
              </button>

              {orderConfirmed && (
                <div className="mt-4 p-5 bg-green-50 border border-green-200 text-green-800 rounded-xl text-center">
                  <div className="text-3xl mb-2">🎉</div>
                  <h3 className="font-bold text-base mb-1">Merci pour votre commande !</h3>
                  {confirmedOrderId && (
                    <p className="text-sm mt-2 text-green-700">
                      Numéro de commande : <span className="font-bold text-green-900">#{confirmedOrderId}</span>
                    </p>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      <Footer footerSections={footerSections} />
    </div>
  );
}
