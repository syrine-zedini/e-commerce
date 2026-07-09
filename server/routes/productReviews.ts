import type { Express } from "express";
import express from "express";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { productReviews } from "@shared/schema";
import { asyncHandler } from "../lib/asyncHandler";

const reviewSelect = {
  id: productReviews.id,
  product_id: productReviews.productId,
  user_id: productReviews.userId,
  user_name: productReviews.userName,
  rating: productReviews.rating,
  comment: productReviews.comment,
  created_at: productReviews.createdAt,
};

export function registerProductReviewRoutes(app: Express) {
  app.get("/api/product-reviews", asyncHandler(async (req, res) => {
    const productId = req.query.productId;
    let query = getDb().select(reviewSelect).from(productReviews).$dynamic();
    if (productId) query = query.where(eq(productReviews.productId, Number(productId)));
    query = query.orderBy(desc(productReviews.createdAt));
    res.json(await query);
  }));

  app.post("/api/product-reviews", express.json(), asyncHandler(async (req, res) => {
    const { product_id, user_id, user_name, rating, comment } = req.body;
    const [row] = await getDb()
      .insert(productReviews)
      .values({ productId: product_id, userId: user_id, userName: user_name, rating, comment })
      .returning(reviewSelect);
    res.json(row);
  }));

  app.delete("/api/product-reviews/:id", asyncHandler(async (req, res) => {
    await getDb().delete(productReviews).where(eq(productReviews.id, Number(req.params.id)));
    res.json({ success: true });
  }));
}
