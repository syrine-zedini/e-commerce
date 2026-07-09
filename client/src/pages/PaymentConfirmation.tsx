// src/pages/PaymentConfirmation.tsx
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { apiPut } from "@/lib/api";

export default function PaymentConfirmation() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [, setLocation] = useLocation();

  useEffect(() => {
    // ✅ Extract token from URL (Paymee will append it)
    const params = new URLSearchParams(window.location.search);
    const token = params.get("payment_token");
    const orderId = params.get("order_id"); // we sent it earlier as note/id

    if (!token) {
      setStatus("error");
      setMessage("Aucun token de paiement trouvé.");
      return;
    }

    // ✅ Call your backend or directly Paymee to verify payment
    async function verifyPayment() {
      try {
        const response = await fetch(
          `https://sandbox.paymee.tn/api/v2/payments/${token}/check`,
          {
            headers: {
              Authorization: `Token e462aedff4672188f7d1de9eaba356c49ed31d9c`,
            },
          }
        );

        const result = await response.json();
        console.log("👉 Vérification Paymee:", result);

        if (result.data?.payment_status === "SUCCESS") {
          setStatus("success");
          setMessage("✅ Paiement confirmé avec succès !");

          // ✅ Update order statut via API
          if (orderId) {
            await apiPut(`/api/commandes/${orderId}`, { statut: "paid" });
          }

          // Vider le panier local
          localStorage.removeItem("checkoutCart");
        } else {
          setStatus("error");
          setMessage("❌ Paiement non confirmé. Veuillez réessayer.");
        }
      } catch (err) {
        console.error(err);
        setStatus("error");
        setMessage("Erreur lors de la vérification du paiement.");
      }
    }

    verifyPayment();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md">
        {status === "loading" && <p>⏳ Vérification de votre paiement...</p>}
        {status === "success" && (
          <>
            <h2 className="text-2xl font-bold text-green-600 mb-4">Paiement réussi</h2>
            <p className="mb-6">{message}</p>
            <button
              className="bg-app-primary text-white px-6 py-2 rounded-lg"
              onClick={() => setLocation("/products")}
            >
              Continuer vos achats
            </button>
          </>
        )}
        {status === "error" && (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Paiement échoué</h2>
            <p className="mb-6">{message}</p>
            <button
              className="bg-gray-500 text-white px-6 py-2 rounded-lg"
              onClick={() => setLocation("/checkout")}
            >
              Réessayer
            </button>
          </>
        )}
      </div>
    </div>
  );
}
