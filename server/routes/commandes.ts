import type { Express } from "express";
import express from "express";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { commandes } from "@shared/schema";
import { asyncHandler } from "../lib/asyncHandler";
import { pickFields, inputToSet } from "../lib/queryHelpers";
import { adjustProductStock } from "../lib/stock";

const commandeSelect = {
  id: commandes.id,
  nom: commandes.nom,
  prenom: commandes.prenom,
  email: commandes.email,
  phone: commandes.phone,
  adresse: commandes.adresse,
  province: commandes.province,
  ville: commandes.ville,
  code_postal: commandes.codePostal,
  mot_de_passe: commandes.motDePasse,
  paiement_mode: commandes.paiementMode,
  frais_livraison: commandes.fraisLivraison,
  total: commandes.total,
  produits: commandes.produits,
  statut: commandes.statut,
  created_at: commandes.createdAt,
};

const commandeInputMap: Record<string, string> = {
  nom: "nom", prenom: "prenom", email: "email", phone: "phone", adresse: "adresse",
  province: "province", ville: "ville", code_postal: "codePostal", mot_de_passe: "motDePasse",
  paiement_mode: "paiementMode", frais_livraison: "fraisLivraison", total: "total",
  produits: "produits", statut: "statut",
};
function commandeInputToSet(body: any) {
  return inputToSet(body, commandeInputMap);
}

// Gives back the stock reserved at checkout when an order is cancelled.
// `produits` is the cart snapshot stored on the order (see commandes.produits),
// each item shaped like { id, quantity, ... } — same shape POST /api/decrement-stock
// consumes at checkout, just applied in reverse (positive delta).
async function restockCancelledOrder(db: ReturnType<typeof getDb>, produits: unknown) {
  const items = Array.isArray(produits) ? produits : [];
  for (const item of items as any[]) {
    const productId = Number(item?.id);
    const quantity = Number(item?.quantity) || 0;
    if (!productId || quantity <= 0) continue;
    await adjustProductStock(db, productId, quantity);
  }
}

export function registerCommandeRoutes(app: Express) {
  app.post("/api/commandes", express.json(), asyncHandler(async (req, res) => {
    const set = commandeInputToSet(req.body);
    const [row] = await getDb().insert(commandes).values(set).returning(commandeSelect);
    res.json(row);
  }));

  app.get("/api/commandes", asyncHandler(async (req, res) => {
    const q = req.query;
    const conditions = [];
    if (q.id) conditions.push(eq(commandes.id, Number(q.id)));
    if (q.email) conditions.push(eq(commandes.email, String(q.email)));
    const selectShape = pickFields(commandeSelect, q.fields as string | undefined);
    let query = getDb().select(selectShape).from(commandes).$dynamic();
    if (conditions.length > 0) query = query.where(and(...conditions));
    query = query.orderBy(desc(commandes.createdAt));
    res.json(await query);
  }));

  app.put("/api/commandes/:id", express.json(), asyncHandler(async (req, res) => {
    const set = commandeInputToSet(req.body);
    const db = getDb();
    const orderId = Number(req.params.id);

    if (set.statut === "cancelled") {
      const [before] = await db
        .select({ statut: commandes.statut, produits: commandes.produits })
        .from(commandes)
        .where(eq(commandes.id, orderId));
      if (before && before.statut !== "cancelled") {
        await restockCancelledOrder(db, before.produits);
      }
    }

    const [row] = await db.update(commandes).set(set).where(eq(commandes.id, orderId)).returning(commandeSelect);
    res.json(row);
  }));

  app.delete("/api/commandes/:id", asyncHandler(async (req, res) => {
    await getDb().delete(commandes).where(eq(commandes.id, Number(req.params.id)));
    res.json({ success: true });
  }));

  app.delete("/api/commandes", asyncHandler(async (req, res) => {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "email requis" });
    await getDb().delete(commandes).where(eq(commandes.email, String(email)));
    res.json({ success: true });
  }));

  // Replicates prior behaviour exactly.
  app.post("/api/auth/login", express.json(), asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const [row] = await getDb()
      .select(commandeSelect)
      .from(commandes)
      .where(and(eq(commandes.email, String(email || "").trim()), eq(commandes.motDePasse, String(password || "").trim())))
      .orderBy(desc(commandes.createdAt))
      .limit(1);
    if (!row) return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    res.json(row);
  }));
}
