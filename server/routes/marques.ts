import type { Express } from "express";
import express from "express";
import { asc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { marques } from "@shared/schema";
import { asyncHandler } from "../lib/asyncHandler";

const marqueSelect = {
  id: marques.id,
  name: marques.name,
  image: marques.image,
  order: marques.order,
  created_at: marques.createdAt,
};

export function registerMarqueRoutes(app: Express) {
  app.get("/api/marques", asyncHandler(async (_req, res) => {
    const rows = await getDb().select(marqueSelect).from(marques).orderBy(asc(marques.order), asc(marques.id));
    res.json(rows);
  }));

  app.post("/api/marques", express.json(), asyncHandler(async (req, res) => {
    const { name, image, order } = req.body;
    const [row] = await getDb().insert(marques).values({ name, image, order }).returning(marqueSelect);
    res.json(row);
  }));

  app.put("/api/marques/:id", express.json(), asyncHandler(async (req, res) => {
    const { name, image, order } = req.body;
    const set: Record<string, any> = {};
    if (name !== undefined) set.name = name;
    if (image !== undefined) set.image = image;
    if (order !== undefined) set.order = order;
    const [row] = await getDb().update(marques).set(set).where(eq(marques.id, Number(req.params.id))).returning(marqueSelect);
    res.json(row);
  }));

  app.delete("/api/marques/:id", asyncHandler(async (req, res) => {
    await getDb().delete(marques).where(eq(marques.id, Number(req.params.id)));
    res.json({ success: true });
  }));
}
