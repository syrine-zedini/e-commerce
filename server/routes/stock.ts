import type { Express, Request, Response } from "express";
import { getDb } from "../db";
import { adjustProductStock } from "../lib/stock";

export function registerStockRoutes(app: Express) {
  app.post("/api/decrement-stock", async (req: Request, res: Response) => {
    try {
      const { items } = req.body as { items: { id: number | string; quantity: number }[] };

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "items array is required" });
      }

      const db = getDb();
      const results: { id: number | string; newStock: number; status: string }[] = [];

      for (const item of items) {
        const result = await adjustProductStock(db, Number(item.id), -item.quantity);
        if (!result) {
          console.warn(`⚠️ Could not fetch product ${item.id}`);
          continue;
        }

        console.log(`✅ Product ${item.id}: stock → ${result.newStock} (${result.newStatus})`);
        results.push({ id: item.id, newStock: result.newStock, status: result.newStatus });
      }

      return res.json({ success: true, updated: results });
    } catch (err: any) {
      console.error("❌ decrement-stock error:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });
}
