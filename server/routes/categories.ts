import type { Express } from "express";
import express from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { categories } from "@shared/schema";
import { asyncHandler } from "../lib/asyncHandler";

const categorySelect = {
  id: categories.id,
  name: categories.name,
  image: categories.image,
};

export function registerCategoryRoutes(app: Express) {
  app.get("/api/categories", asyncHandler(async (_req, res) => {
    const rows = await getDb().select(categorySelect).from(categories);
    res.json(rows);
  }));

  app.post("/api/categories", express.json(), asyncHandler(async (req, res) => {
    const { name, image } = req.body;
    const [row] = await getDb().insert(categories).values({ name, image }).returning(categorySelect);
    res.json(row);
  }));

  app.put("/api/categories/:id", express.json(), asyncHandler(async (req, res) => {
    const { name, image } = req.body;
    const set: Record<string, any> = {};
    if (name !== undefined) set.name = name;
    if (image !== undefined) set.image = image;
    const [row] = await getDb().update(categories).set(set).where(eq(categories.id, Number(req.params.id))).returning(categorySelect);
    res.json(row);
  }));

  app.delete("/api/categories/:id", asyncHandler(async (req, res) => {
    await getDb().delete(categories).where(eq(categories.id, Number(req.params.id)));
    res.json({ success: true });
  }));
}
