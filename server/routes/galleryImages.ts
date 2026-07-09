import type { Express } from "express";
import express from "express";
import { asc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { galleryImages } from "@shared/schema";
import { asyncHandler } from "../lib/asyncHandler";

const galleryImageSelect = {
  id: galleryImages.id,
  image_url: galleryImages.imageUrl,
  order: galleryImages.order,
};

export function registerGalleryImageRoutes(app: Express) {
  app.get("/api/gallery-images", asyncHandler(async (_req, res) => {
    const rows = await getDb().select(galleryImageSelect).from(galleryImages).orderBy(asc(galleryImages.id));
    res.json(rows);
  }));

  app.post("/api/gallery-images", express.json(), asyncHandler(async (req, res) => {
    const { image_url, order } = req.body;
    const [row] = await getDb().insert(galleryImages).values({ imageUrl: image_url, order }).returning(galleryImageSelect);
    res.json(row);
  }));

  app.put("/api/gallery-images/:id", express.json(), asyncHandler(async (req, res) => {
    const { image_url, order } = req.body;
    const set: Record<string, any> = {};
    if (image_url !== undefined) set.imageUrl = image_url;
    if (order !== undefined) set.order = order;
    const [row] = await getDb().update(galleryImages).set(set).where(eq(galleryImages.id, Number(req.params.id))).returning(galleryImageSelect);
    res.json(row);
  }));

  app.delete("/api/gallery-images/:id", asyncHandler(async (req, res) => {
    await getDb().delete(galleryImages).where(eq(galleryImages.id, Number(req.params.id)));
    res.json({ success: true });
  }));
}
