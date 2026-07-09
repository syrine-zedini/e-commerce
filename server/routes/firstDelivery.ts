import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { commandes } from "@shared/schema";

const FIRST_DELIVERY_BASE_URL = "https://www.firstdeliverygroup.com/api/v2";

// Read lazily (at request time), not at module load: this file is imported by
// server/index.ts before that file calls loadDotEnvFiles(), so a top-level
// `const ... = process.env.FIRST_DELIVERY_TOKEN` would always capture "".
function getFirstDeliveryToken() {
  return process.env.FIRST_DELIVERY_TOKEN || "";
}

export function registerFirstDeliveryRoutes(app: Express) {
  // GET /api/first-delivery/localities — liste des localités
  app.get("/api/first-delivery/localities", async (_req: Request, res: Response) => {
    try {
      const response = await fetch(`${FIRST_DELIVERY_BASE_URL}/localities`, {
        headers: {
          Authorization: `Bearer ${getFirstDeliveryToken()}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("First Delivery localities error:", text);
        return res.status(response.status).json({ error: "Erreur First Delivery", detail: text });
      }

      const data = await response.json();
      // L'API retourne { status, isError, message, result: [...] }
      return res.json(data.result || data);
    } catch (err: any) {
      console.error("Error fetching First Delivery localities:", err.message);
      return res.status(500).json({ error: "Impossible de contacter First Delivery", detail: err.message });
    }
  });

  // POST /api/first-delivery/create-order — créer une commande
  app.post("/api/first-delivery/create-order", async (req: Request, res: Response) => {
    try {
      const { orderId, localityId } = req.body;

      if (!orderId || !localityId) {
        return res.status(400).json({ error: "orderId et localityId sont requis" });
      }

      const db = getDb();
      const [row] = await db.select().from(commandes).where(eq(commandes.id, Number(orderId)));
      if (!row) {
        return res.status(404).json({ error: "Commande introuvable" });
      }
      const order: any = { ...row, paiement_mode: row.paiementMode };

      // Calculer le nombre total d'articles
      const produits = order.produits || [];
      const nombreArticle = produits.reduce((sum: number, p: any) => sum + (p.quantity || p.quantite || 1), 0);
      const articleNames = produits.map((p: any) => p.name || p.nom || "Produit").join(", ");

      // Construire le payload selon la doc officielle First Delivery
      const payload = {
        Client: {
          nom: `${order.nom || ""} ${order.prenom || ""}`.trim(),
          locality_id: Number(localityId),
          gouvernerat: order.ville || "",
          ville: order.ville || "",
          adresse: order.adresse || "",
          telephone: order.phone || order.telephone || "",
          telephone2: "",
        },
        Produit: {
          prix: order.total || 0,
          designation: `Commande Floreapara #${orderId}`,
          nombreArticle: nombreArticle || 1,
          commentaire: `Paiement: ${order.paiement_mode || "Cash"}`,
          article: articleNames || "Produits Floreapara",
          nombreEchange: 0,
        },
      };

      const response = await fetch(`${FIRST_DELIVERY_BASE_URL}/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getFirstDeliveryToken()}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("First Delivery create-order error:", text);
        return res.status(response.status).json({ error: "Erreur lors de la création", detail: text });
      }

      const data = await response.json();
      const barCode = data.barCode || data.bar_code || data.result?.barCode || data.result?.bar_code;

      if (barCode) {
        await db
          .update(commandes)
          .set({ firstDeliveryBarcode: barCode, firstDeliveryStatus: "En attente" })
          .where(eq(commandes.id, Number(orderId)));
      }

      return res.json({
        barCode: barCode || null,
        link: null,
      });
    } catch (err: any) {
      console.error("Error creating First Delivery order:", err.message);
      return res.status(500).json({ error: "Erreur serveur", detail: err.message });
    }
  });

  // POST /api/first-delivery/status/:barCode — statut d'une commande (via POST /etat selon la doc)
  app.get("/api/first-delivery/status/:barCode", async (req: Request, res: Response) => {
    try {
      const { barCode } = req.params;

      // L'API First Delivery utilise POST /etat avec { barCode } dans le body
      const response = await fetch(`${FIRST_DELIVERY_BASE_URL}/etat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getFirstDeliveryToken()}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ barCode }),
      });

      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({ error: "Erreur First Delivery", detail: text });
      }

      const data = await response.json();

      // Mapper les codes d'état numériques en libellés français
      const stateLabels: { [key: number]: string } = {
        0: "En attente",
        1: "En cours",
        2: "Livré",
        3: "Echange",
        5: "Retour Expéditeur",
        6: "Annulé",
        7: "Retour client/agence",
        8: "Au magasin",
        11: "Retour dépôt",
        20: "A vérifier",
        30: "Retour reçu",
        31: "Retour définitif",
      };

      const stateCode = data.state ?? data.result?.state;
      const stateLabel = stateLabels[stateCode] || data.stateName || data.result?.stateName || "Inconnu";

      // Persist the latest known status so it survives page reloads / is visible
      // outside the admin's live-polling session, not just kept in browser state.
      await getDb()
        .update(commandes)
        .set({ firstDeliveryStatus: stateLabel })
        .where(eq(commandes.firstDeliveryBarcode, barCode));

      return res.json({
        barCode,
        state: stateLabel,
        stateCode,
      });
    } catch (err: any) {
      console.error("Error fetching First Delivery status:", err.message);
      return res.status(500).json({ error: "Erreur serveur", detail: err.message });
    }
  });
}
