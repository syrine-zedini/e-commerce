import type { Express } from "express";
import express from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { seoPages } from "@shared/schema";
import { asyncHandler } from "../lib/asyncHandler";

const seoPageSelect = {
  id: seoPages.id,
  slug: seoPages.slug,
  title: seoPages.title,
  description: seoPages.description,
  isPublished: seoPages.isPublished,
  created_at: seoPages.createdAt,
};

export function registerSeoPageRoutes(app: Express) {
  app.get("/api/seo-pages", asyncHandler(async (_req, res) => {
    const rows = await getDb().select(seoPageSelect).from(seoPages);
    res.json(rows);
  }));

  app.post("/api/seo-pages", express.json(), asyncHandler(async (req, res) => {
    const { slug, title, description, isPublished } = req.body;
    const [row] = await getDb().insert(seoPages).values({ slug, title, description, isPublished }).returning(seoPageSelect);
    res.json(row);
  }));

  app.put("/api/seo-pages/:id", express.json(), asyncHandler(async (req, res) => {
    const { slug, title, description, isPublished } = req.body;
    const set: Record<string, any> = {};
    if (slug !== undefined) set.slug = slug;
    if (title !== undefined) set.title = title;
    if (description !== undefined) set.description = description;
    if (isPublished !== undefined) set.isPublished = isPublished;
    const [row] = await getDb().update(seoPages).set(set).where(eq(seoPages.id, Number(req.params.id))).returning(seoPageSelect);
    res.json(row);
  }));
}
