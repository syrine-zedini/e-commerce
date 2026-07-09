// src/lib/paymee.ts

// utils/paymee.ts
export async function createPaymeeTransaction(order: any) {
  try {
    // ✅ Remplace localhost par l’URL HTTPS de ngrok
    const NGROK_URL = "https://b0778215ae80.ngrok-free.app"; // ✅ ta URL actuelle

    const payload = {
      amount: order.total,
      note: `Commande #${order.id}`,
      first_name: order.prenom,
      last_name: order.nom,
      email: order.email,
      phone: order.phone ?? "20000000", // fallback si non fourni
      return_url: `${NGROK_URL}/payment-confirmation?order_id=${order.id}`,
      webhook_url: `${NGROK_URL}/api/paymee-webhook`,
    };

    const response = await fetch("https://sandbox.paymee.tn/api/v2/payments/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token e462aedff4672188f7d1de9eaba356c49ed31d9c`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log("✅ Paymee response:", result);

    return result.data || null;
  } catch (error: any) {
    console.error("❌ Paymee error:", error);
    throw new Error("Erreur Paymee");
  }
}
