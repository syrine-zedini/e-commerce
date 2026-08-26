import type { Express } from "express";
import express from "express";
import { and, asc, desc, eq, gt, inArray, isNotNull, ne } from "drizzle-orm";
import { getDb } from "../db";
import { products, promotionProducts, productReviews, wishlist } from "@shared/schema";
import { asyncHandler } from "../lib/asyncHandler";
import { pickFields, inputToSet } from "../lib/queryHelpers";

// JSON responses use snake_case keys to match the frontend's existing field
// access (product.original_price, etc.).
const productSelect = {
  id: products.id,
  name: products.name,
  code: products.code,
  description: products.description,
  description_detaillee: products.descriptionDetaillee,
  contenance: products.contenance,
  brand: products.brand,
  original_price: products.originalPrice,
  discounted_price: products.discountedPrice,
  image_path: products.imagePath,
  category_id: products.categoryId,
  new: products.new,
  popular: products.popular,
  promo: products.promo,
  stock_status: products.stockStatus,
  form: products.form,
  discount_percentage: products.discountPercentage,
  is_active: products.isActive,
  created_at: products.createdAt,
  tva: products.tva,
};

const productInputMap: Record<string, string> = {
  name: "name", code: "code", description: "description",
  description_detaillee: "descriptionDetaillee", contenance: "contenance", brand: "brand",
  original_price: "originalPrice", discounted_price: "discountedPrice", image_path: "imagePath",
  category_id: "categoryId", new: "new", popular: "popular", promo: "promo",
  stock_status: "stockStatus", form: "form", discount_percentage: "discountPercentage",
  is_active: "isActive", tva: "tva",
};
function productInputToSet(body: any) {
  return inputToSet(body, productInputMap);
}

export function registerProductRoutes(app: Express) {
  app.get("/api/products", asyncHandler(async (req, res) => {
    const q = req.query;
    const conditions = [];
    if (q.activeOnly === "1") conditions.push(eq(products.isActive, true));
    if (q.inStockOnly === "1") conditions.push(ne(products.stockStatus, "en rupture de stock"));
    if (q.withPriceOnly === "1") {
      conditions.push(isNotNull(products.originalPrice));
      conditions.push(gt(products.originalPrice, "0"));
    }
    if (q.withImageOnly === "1") {
      conditions.push(isNotNull(products.imagePath));
      conditions.push(ne(products.imagePath, ""));
    }
    if (q.categoryId) conditions.push(eq(products.categoryId, Number(q.categoryId)));
    if (q.brand) conditions.push(eq(products.brand, String(q.brand)));
    if (q.excludeId) conditions.push(ne(products.id, Number(q.excludeId)));
    if (q.ids) {
      const ids = String(q.ids).split(",").map(Number).filter((n) => !Number.isNaN(n));
      if (ids.length > 0) conditions.push(inArray(products.id, ids));
    }

    const selectShape = pickFields(productSelect, q.fields as string | undefined);
    let query = getDb().select(selectShape).from(products).$dynamic();
    if (conditions.length > 0) query = query.where(and(...conditions));
    query = q.sort === "name"
      ? query.orderBy(q.order === "desc" ? desc(products.name) : asc(products.name))
      : query.orderBy(q.order === "asc" ? asc(products.id) : desc(products.id));

    const limit = q.limit ? Number(q.limit) : undefined;
    const offset = q.offset ? Number(q.offset) : undefined;
    if (limit !== undefined) query = query.limit(limit);
    if (offset !== undefined) query = query.offset(offset);

    res.json(await query);
  }));

  app.get("/api/products/:id", asyncHandler(async (req, res) => {
    const [row] = await getDb().select(productSelect).from(products).where(eq(products.id, Number(req.params.id)));
    if (!row) return res.status(404).json({ error: "Produit introuvable" });
    res.json(row);
  }));

  app.post("/api/products", express.json(), asyncHandler(async (req, res) => {
    const set = productInputToSet(req.body) as typeof products.$inferInsert;
    const [row] = await getDb().insert(products).values(set).returning(productSelect);
    res.json(row);
  }));

  app.put("/api/products/:id", express.json(), asyncHandler(async (req, res) => {
    const set = productInputToSet(req.body);
    const [row] = await getDb().update(products).set(set).where(eq(products.id, Number(req.params.id))).returning(productSelect);
    res.json(row);
  }));

  app.delete("/api/products/:id", asyncHandler(async (req, res) => {
    const productId = Number(req.params.id);
    await getDb().delete(promotionProducts).where(eq(promotionProducts.productId, productId));
    await getDb().delete(productReviews).where(eq(productReviews.productId, productId));
    await getDb().delete(wishlist).where(eq(wishlist.productId, productId));
    await getDb().delete(products).where(eq(products.id, productId));
    res.json({ success: true });
  }));
}
