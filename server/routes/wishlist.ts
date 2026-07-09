import type { Express } from "express";
import express from "express";
import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { wishlist } from "@shared/schema";
import { asyncHandler } from "../lib/asyncHandler";

const wishlistSelect = {
  id: wishlist.id,
  session_id: wishlist.sessionId,
  user_id: wishlist.userId,
  product_id: wishlist.productId,
};

export function registerWishlistRoutes(app: Express) {
  app.get("/api/wishlist", asyncHandler(async (req, res) => {
    const q = req.query;
    const conditions = [];
    if (q.userId) conditions.push(eq(wishlist.userId, String(q.userId)));
    if (q.sessionId) conditions.push(eq(wishlist.sessionId, String(q.sessionId)));
    if (q.productId) conditions.push(eq(wishlist.productId, Number(q.productId)));
    let query = getDb().select(wishlistSelect).from(wishlist).$dynamic();
    if (conditions.length > 0) query = query.where(and(...conditions));
    const rows = await query;
    res.json(q.single === "1" ? (rows[0] || null) : rows);
  }));

  app.post("/api/wishlist", express.json(), asyncHandler(async (req, res) => {
    const { user_id, session_id, product_id } = req.body;
    const [row] = await getDb()
      .insert(wishlist)
      .values({ userId: user_id, sessionId: session_id, productId: product_id })
      .returning(wishlistSelect);
    res.json(row);
  }));

  app.delete("/api/wishlist/:id", asyncHandler(async (req, res) => {
    await getDb().delete(wishlist).where(eq(wishlist.id, Number(req.params.id)));
    res.json({ success: true });
  }));
}
