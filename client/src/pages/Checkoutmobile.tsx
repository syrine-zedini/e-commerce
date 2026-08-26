import React, { useEffect, useState } from "react";
import { convertImageUrl, onImgError } from "@/lib/imageUtils";
import { FooterMobile } from "@/components/ui/FooterMobile";
import { MobileHeader } from "@/components/MobileHeader";
import { apiGet, apiPost } from "@/lib/api";
import toast from "react-hot-toast";
import { useCart } from "@/contexts/CartProvider";
import { TUNISIA_DATA as tunisiaData } from "@/lib/tunisiaData";
import { HEADER_LINKS, toMobileFooterSections } from "@/lib/pageData";

export const CheckoutMobile = (): JSX.Element => {
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
  });
  const [, setShowCustomCity] = useState(false);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [showOtherCityInput, setShowOtherCityInput] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | number | null>(null);
  const [fraisLivraison, setFraisLivraison] = useState(7);
  const [isLoading, setIsLoading] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);


  const navLinks = HEADER_LINKS;
  const footerSections = toMobileFooterSections();


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
      const maxOrderable = stockVal !== null ? stockVal : null;
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

  const sousTotal = cart.reduce((sum, item) => sum + (item.discounted_price || 0) * item.quantity, 0);
  const total = sousTotal + fraisLivraison;

  const totalTVA = cart.reduce((sum, item) => {
    const price = item.discounted_price || item.original_price || item.price || 0;
    const priceTtc = price * item.quantity;
    const tvaRate = item.tva ? Number(item.tva) : 0;
    const itemTVA = tvaRate > 0 ? (priceTtc * tvaRate / (100 + tvaRate)) : 0;
    return sum + itemTVA;
  }, 0);

  useEffect(() => {
    if (sousTotal >= 69) {
      setFraisLivraison(0);
    } else {
      setFraisLivraison(7);
    }
  }, [sousTotal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });

    // Check for "Autres" city
    if (e.target.name === "ville" && e.target.value === "Autres") {
      setShowOtherCityInput(true);
    } else if (e.target.name === "ville") {
      setShowOtherCityInput(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // ⏳ start loading

    try {
      // 1️⃣ Insert order via API
      let order: any;
      try {
        order = await apiPost("/api/commandes", {
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

      console.log("✅ Commande enregistrée:", order);

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

      // 3️⃣ Clear cart + show success
      setConfirmedOrderId(order?.id ?? null);
      setOrderConfirmed(true);
      toast.success("✅ Commande enregistrée avec succès !");
      localStorage.removeItem("userCart");
      localStorage.removeItem("florea_cart");
      localStorage.removeItem("cart");
      clearGlobalCart();
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
      });
      setSelectedProvince("");
      setCities([]);
    } catch (err) {
      console.error("❌ Erreur inattendue:", err);
      toast.error("❌ Une erreur inattendue s'est produite");
    } finally {
      setIsLoading(false); // ✅ stop loading when done
    }
  };


  useEffect(() => {
    localStorage.setItem("userCart", JSON.stringify(cart));
  }, [cart]);

  return (
    <div className="bg-white min-h-screen w-full">
      <div className="bg-white w-full">
        <MobileHeader navLinks={navLinks} />

        {/* Hero Section */}
        <section className="w-full h-[160px] relative bg-[url(/figmaAssets/products/rectangle-230.png)] bg-cover bg-center">
          <div className="w-full h-full bg-gradient-to-r from-app-secondary to-transparent absolute top-0 left-0" />
          <div className="relative h-full flex flex-col justify-center px-6">
            <h1 className="font-bold text-white text-2xl">Checkout</h1>
            <p className="text-white/80 text-sm mt-1">Accueil &gt; Commande</p>
          </div>
        </section>
        <div className="max-w-5xl mx-auto px-4 py-10">

          <h2 className="text-2xl font-bold mb-6">Finaliser votre commande</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-xl font-semibold mb-4">Votre panier</h3>
              <ul className="space-y-4">
                {cart.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-4">
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
                      className="w-16 h-16 object-cover rounded"
                      onError={onImgError}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
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
                      <div className="flex items-center space-x-2 mt-1">
                        <button
                          type="button"
                          onClick={() => decrementQuantity(item.id)}
                          className="px-2 py-1 bg-gray-200 rounded"
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => incrementQuantity(item.id)}
                          className="px-2 py-1 bg-gray-200 rounded"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-4 border-t pt-4 text-lg font-bold space-y-2">
                <div className="flex justify-between text-gray-700 font-medium">
                  <span>Sous-total :</span>
                  <span>{sousTotal.toFixed(3)} TND</span>
                </div>
                <div className="flex justify-between text-gray-700 font-medium">
                  <span>Frais de livraison :</span>
                  <span>
                    {fraisLivraison === 0 ? "Gratuite" : `${fraisLivraison.toFixed(3)} TND`}
                  </span>
                </div>

                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>Total :</span>
                  <div className="text-right">
                    <span className="block">{total.toFixed(3)} TND</span>
                    <span className="text-[10px] text-gray-400 font-medium block">dont {totalTVA.toFixed(3)} TND TVA</span>
                  </div>
                </div>
              </div>

            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Vos informations</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input name="nom" value={form.nom} onChange={handleChange} type="text" placeholder="Nom" className="border p-2 rounded w-full" required />
                  <input name="prenom" value={form.prenom} onChange={handleChange} type="text" placeholder="Prénom" className="border p-2 rounded w-full" required />
                </div>

                <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="Adresse e-mail" className="border p-2 rounded w-full" required />
                <input name="phone" value={form.phone} onChange={handleChange} type="number" placeholder="Numéro de téléphone" className="border p-2 rounded w-full" required />
                <input name="adresse" value={form.adresse} onChange={handleChange} type="text" placeholder="Adresse" className="border p-2 rounded w-full" required />

                <div className="grid grid-cols-2 gap-4">
                  {/* Province Dropdown */}
                  <select
                    name="province"
                    value={selectedProvince}
                    onChange={(e) => {
                      const province = e.target.value;
                      setSelectedProvince(province);
                      setCities(tunisiaData[province] || []);
                      setForm({ ...form, ville: "" });
                      setShowCustomCity(false);
                    }}
                    className="border p-2 rounded w-full text-sm focus:outline-none focus:ring-2 focus:ring-app-primary/30"
                    required
                  >
                    <option value="">Gouvernorat</option>
                    {Object.keys(tunisiaData).map((province) => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>

                  {/* City Dropdown with text input and filtered suggestions */}
                  <div className="relative w-full">
                    <div className="relative">
                      <input
                        name="ville"
                        type="text"
                        placeholder={selectedProvince ? "Sélectionnez ou tapez..." : "Ville"}
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
                        className="border p-2 rounded w-full text-sm focus:outline-none focus:ring-2 focus:ring-app-primary/30"
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
                        <ul className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-sm text-gray-700 text-left">
                          {(() => {
                            const filtered = (cities || []).filter(city => 
                              city.toLowerCase().includes(form.ville.toLowerCase())
                            );
                            if (filtered.length === 0) {
                              return (
                                <li className="px-4 py-2 text-gray-400 italic text-xs">
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
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer transition-colors text-xs"
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

                {/* Show input if "Autres" */}
                {showOtherCityInput && (
                  <input
                    name="ville"
                    value={form.ville}
                    onChange={handleChange}
                    type="text"
                    placeholder="Entrez votre ville"
                    className="border p-2 rounded w-full mt-2"
                    required
                  />
                )}

                <input name="code_postal" value={form.code_postal} onChange={handleChange} type="number" placeholder="Code postal" className="border p-2 rounded w-full" required />

                {/* Payment Mode */}
                <div>
                  <p className="font-semibold mb-2">Mode de paiement</p>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-sm font-semibold text-gray-800">🚚 À la livraison</span>
                    <p className="text-xs text-gray-500">{fraisLivraison.toFixed(3)} DT frais de livraison</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || orderConfirmed}
                  className={`w-full py-2 rounded-lg font-medium mt-4 flex items-center justify-center ${(isLoading || orderConfirmed)
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-app-primary hover:bg-app-primary/90 text-white"
                    }`}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                      </svg>
                      Traitement...
                    </>
                  ) : (
                    "Confirmer la commande"
                  )}
                </button>


                {orderConfirmed && (
                  <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-800 rounded-lg shadow-md text-center">
                    <h3 className="font-semibold text-lg mb-2">Merci pour votre commande !</h3>
                    {confirmedOrderId && (
                      <p className="text-sm mt-1 text-green-700">
                        Numéro de commande : <span className="font-bold text-green-900">#{confirmedOrderId}</span>
                      </p>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
        <br />


        {/* Footer */}
        <FooterMobile sections={footerSections} />

      </div>
    </div>
  );
};