import { eq } from "drizzle-orm";
import { products } from "@shared/schema";
import type { getDb } from "../db";

function computeStockStatus(stock: number) {
  return stock <= 0 ? "en rupture de stock" : "en stock";
}

// Applies `delta` to a product's stock (negative to decrement at checkout,
// positive to restock on order cancellation), clamped at 0, and recomputes
// stock_status with the same threshold everywhere stock changes. Shared by
// server/routes/stock.ts (checkout decrement) and server/routes/commandes.ts
// (restock when an order is cancelled).
export async function adjustProductStock(db: ReturnType<typeof getDb>, productId: number, delta: number) {
  const [prod] = await db.select({ form: products.form }).from(products).where(eq(products.id, productId));
  if (!prod) return null;

  const currentStock = prod.form !== null && prod.form !== undefined && prod.form !== ""
    ? Number(prod.form) : 0;
  const newStock = Math.max(0, currentStock + delta);
  const newStatus = computeStockStatus(newStock);

  await db
    .update(products)
    .set({ form: String(newStock), stockStatus: newStatus })
    .where(eq(products.id, productId));

  return { newStock, newStatus };
}
