import type { Express, Request, Response } from "express";
import express from "express";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../db";
import { products, promotions, promotionProducts } from "@shared/schema";
import { asyncHandler } from "../lib/asyncHandler";

const promotionSelect = {
  id: promotions.id,
  name: promotions.name,
  type: promotions.type,
  value: promotions.value,
  start_date: promotions.startDate,
  end_date: promotions.endDate,
  is_active: promotions.isActive,
  created_at: promotions.createdAt,
};

export function registerPromotionRoutes(app: Express) {
  app.get("/api/promotions", asyncHandler(async (req, res) => {
    const q = req.query;
    let query = getDb().select(promotionSelect).from(promotions).$dynamic();
    if (q.active === "1") query = query.where(eq(promotions.isActive, true));
    query = query.orderBy(q.sort === "end_date" ? asc(promotions.endDate) : desc(promotions.createdAt));
    if (q.limit) query = query.limit(Number(q.limit));
    res.json(await query);
  }));

  app.get("/api/promotion-products", asyncHandler(async (req, res) => {
    const ids = String(req.query.promotionIds || "").split(",").map(Number).filter((n) => !Number.isNaN(n));
    if (ids.length === 0) return res.json([]);
    const rows = await getDb()
      .select({ id: promotionProducts.id, promotion_id: promotionProducts.promotionId, product_id: promotionProducts.productId, discounted_price: promotionProducts.discountedPrice })
      .from(promotionProducts)
      .where(inArray(promotionProducts.promotionId, ids));
    res.json(rows);
  }));

  app.delete("/api/promotions/:id", express.json(), async (req: Request, res: Response) => {
    try {
      const db = getDb();
      let productIds: any[] = req.body?.productIds || [];
      const promoId = Number(req.params.id);

      if (productIds.length === 0) {
        const links = await db
          .select({ productId: promotionProducts.productId })
          .from(promotionProducts)
          .where(eq(promotionProducts.promotionId, promoId));
        productIds = links.map((l) => l.productId);
      }

      // Always delete the promotion itself — previously this only ran inside
      // the `productIds.length === 0` branch above, so a delete request that
      // already knew its productIds (the normal case from the UI) never
      // actually removed the row: it looked deleted in the UI (optimistic
      // local state update) but reappeared on next fetch.
      await db.delete(promotionProducts).where(eq(promotionProducts.promotionId, promoId));
      await db.delete(promotions).where(eq(promotions.id, promoId));

      if (productIds.length > 0) {
        await db
          .update(products)
          .set({ promo: false, discountedPrice: null })
          .where(inArray(products.id, productIds.map(Number)));
      }

      return res.json({ success: true, resetProducts: productIds.length });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Promotion Save (insert/update) Route
  app.post("/api/promotions/save", express.json(), async (req: Request, res: Response) => {
    try {
      const { promotion, selectedProductIds, editingId } = req.body as {
        promotion: any;
        selectedProductIds: (number | string)[];
        editingId?: number | string | null;
      };

      const db = getDb();
      const promotionValues = {
        name: promotion.name,
        type: promotion.type,
        value: promotion.value,
        startDate: promotion.start_date,
        endDate: promotion.end_date,
        isActive: promotion.is_active,
      };

      let promotionId: number;

      if (editingId) {
        await db.update(promotions).set(promotionValues).where(eq(promotions.id, Number(editingId)));
        promotionId = Number(editingId);
      } else {
        const [inserted] = await db.insert(promotions).values(promotionValues).returning({ id: promotions.id });
        promotionId = inserted.id;
      }

      const prevLinks = await db
        .select({ productId: promotionProducts.productId })
        .from(promotionProducts)
        .where(eq(promotionProducts.promotionId, promotionId));
      const prevIds = prevLinks.map((l) => l.productId);
      const removedIds = prevIds.filter((id) => !selectedProductIds.map(String).includes(String(id)));

      await db.delete(promotionProducts).where(eq(promotionProducts.promotionId, promotionId));
      if (selectedProductIds.length > 0) {
        await db.insert(promotionProducts).values(
          selectedProductIds.map((pid) => ({ promotionId, productId: Number(pid) }))
        );
      }

      if (removedIds.length > 0) {
        await db
          .update(products)
          .set({ promo: false, discountedPrice: null })
          .where(inArray(products.id, removedIds.filter((id): id is number => id !== null)));
      }

      const selectedIdsNum = selectedProductIds.map(Number);

      if (!promotion.is_active) {
        if (selectedIdsNum.length > 0) {
          await db
            .update(products)
            .set({ promo: false, discountedPrice: null })
            .where(inArray(products.id, selectedIdsNum));
        }
      } else if (selectedIdsNum.length > 0) {
        const prods = await db
          .select({ id: products.id, originalPrice: products.originalPrice })
          .from(products)
          .where(inArray(products.id, selectedIdsNum));

        for (const p of prods) {
          const originalPrice = Number(p.originalPrice);
          let discounted = originalPrice;
          if (promotion.type === "percentage") {
            discounted = originalPrice * (1 - promotion.value / 100);
          } else {
            discounted = originalPrice - promotion.value;
          }
          if (discounted < 0) discounted = 0;
          await db
            .update(products)
            .set({ promo: true, discountedPrice: String(discounted) })
            .where(eq(products.id, p.id));
        }
      }

      return res.json({ success: true, promotionId });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });
}
